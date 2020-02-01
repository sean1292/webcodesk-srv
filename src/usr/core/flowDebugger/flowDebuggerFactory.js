/*
 *    Copyright 2019 Alex (Oleksandr) Pustovalov
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

import forOwn from 'lodash/forOwn';
import * as constants from '../../../commons/constants';
import * as textUtils from '../utils/textUtils';

function propertiesComparator(a, b) {
  if (a.name === constants.FUNCTION_OUTPUT_ERROR_NAME) {
    return 1;
  }
  if (b.name === constants.FUNCTION_OUTPUT_ERROR_NAME) {
    return -1;
  }
  return a.name.localeCompare(b.name);
}

function createFlowByEventTargets(event) {
  const models = [];
  const {name: eventName, targets} = event;
  if (targets && targets.length > 0) {
    let model;
    targets.forEach(target => {
      const {type, props, events} = target;
      if (type === constants.FRAMEWORK_ACTION_SEQUENCE_COMPONENT_TYPE) {
        const { componentName, componentInstance, componentKey, propertyName } = props;
        model = {
          key: componentKey,
          type: constants.FLOW_COMPONENT_INSTANCE_TYPE,
          props: {
            title: textUtils.cutText(componentInstance, 25),
            searchName: componentInstance,
            componentName: componentName,
            componentInstance: componentInstance,
            subtitle: '',
            outputs: [],
          },
          children: [],
        };
        model.props.inputs = [
          {
            name: propertyName,
            connectedTo: eventName,
          }
        ];
      } else if (type === constants.FRAMEWORK_ACTION_SEQUENCE_USER_FUNCTION_TYPE) {
        const {functionName, functionKey, isUsingTargetState} = props;
        let title;
        let searchName;
        const nameParts = functionName ? functionName.split(constants.MODEL_KEY_SEPARATOR) : [];
        if (nameParts.length > 1) {
          title = textUtils.cutText(nameParts[nameParts.length - 1], 35);
          searchName = nameParts[nameParts.length - 1];
        } else {
          title = textUtils.cutText(functionName, 35);
          searchName = functionName;
        }
        model = {
          key: functionKey,
          type: constants.FLOW_USER_FUNCTION_TYPE,
          props: {
            title,
            searchName,
            functionName,
            isUsingTargetState,
            inputs: [
              {
                name: 'callFunction',
                connectedTo: eventName,
              }
            ],
            outputs: [],
          },
          children: [],
        };
      }
      if (events && events.length > 0) {
        events.forEach(event => {
          model.props.outputs.push({
            name: event.name,
          });
          model.children = model.children.concat(createFlowByEventTargets(event));
        });
      }
      model.props.inputs = model.props.inputs.sort((a, b) => a.name.localeCompare(b.name));
      // add extra output for caught error if there were assigned output
      if (model.type === constants.FLOW_USER_FUNCTION_TYPE) {
        if (model.props.outputs.findIndex(i => i.name === constants.FUNCTION_OUTPUT_ERROR_NAME) < 0) {
          model.props.outputs.push({
            name: constants.FUNCTION_OUTPUT_ERROR_NAME
          });
        }
      }
      model.props.outputs = model.props.outputs.sort(propertiesComparator);
      models.push(model);
    });
  }
  return models;
}

function createFlowBySequence(actionSequence) {
  if (actionSequence) {
    const {events, componentName, componentInstance, componentKey} = actionSequence;
    const model = {
      key: componentKey,
      props: {
        outputs: events && events.length > 0
          ? events.map(event => ({name: event.name}))
          : []
      },
      children: [],
    };
    if (events && events.length > 0) {
      events.forEach(event => {
        model.children = model.children.concat(createFlowByEventTargets(event));
      });
    }
    if (componentName === 'applicationStartWrapper' && componentInstance === 'wrapperInstance') {
      model.type = constants.FLOW_APPLICATION_STARTER_TYPE;
      model.props.title = 'Application';
    } else {
      // this is the top level page component
      model.type = constants.FLOW_COMPONENT_INSTANCE_TYPE;
      model.props.title = textUtils.cutText(componentInstance, 35);
      model.props.searchName = componentInstance;
      model.props.componentName = componentName;
      model.props.componentInstance = componentInstance;
    }
    model.props.outputs = model.props.outputs.sort(propertiesComparator);
    return model;
  }
}

export function createFlowModelByActionSequences(actionSequences) {
  const starterPointChildren = [];
  let model;
  forOwn(actionSequences, (value, props) => {
    model = createFlowBySequence(value);
    if (model) {
      model.props = model.props || {};
      model.props.inputs = model.props.inputs || [];
      model.props.inputs.push({
        name: 'entry',
        connectedTo: 'entries',
      });
      starterPointChildren.push(model);
    }
  });

  return {
    key: 'debuggerFlowStarterPointKey',
    type: constants.FLOW_APPLICATION_STARTER_TYPE,
    props: {
      title: 'Start Point',
      inputs: [],
      outputs: [
        {
          name: 'entries'
        }
      ],
    },
    children: starterPointChildren,
  }
}