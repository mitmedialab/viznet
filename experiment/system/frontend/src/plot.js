import { copy } from './util'
import vegaEmbed from 'vega-embed'

export function startAtZero(field, data){
  let fieldData = data.map(d => d[field]);
  let sampleMax = Math.max(...fieldData);
  let sampleMin = Math.min(...fieldData);
  let sampleRange = Math.abs(sampleMax - sampleMin);

  let threshold = 0.1;
  let min = Math.min(0, Math.min(...fieldData))
  if (sampleRange < threshold * Math.abs(sampleMax)) {
    min = Math.min(...fieldData)
    return false;
  }
  return true;
}

export function getXYRange(field, data){
  let fieldData = data.map(d => d[field]);
  let sampleMax = Math.max(...fieldData);
  let sampleMin = Math.min(...fieldData);
  let sampleRange = Math.abs(sampleMax - sampleMin);

  let threshold = 0.1;

  let min = Math.min(0, Math.min(...fieldData))
  if (sampleRange < threshold * Math.abs(sampleMax)) {
    min = Math.min(...fieldData)
  }
  let range = [min, Math.max(...fieldData)];
  return range;
}

export function task(elm, spec, dataset, question, successHandler, errorHandler){
  let cleanedDataset = dataset;

  if(question.annotated){
    question.annotated.forEach(annotation => {
      let annotationOnlyDataFields = copy(annotation);
      delete annotationOnlyDataFields.annotated;
      let matchingDataPoint;
      cleanedDataset.filter(function(dataPoint) {
        let matches = [];

        // Iterate through annotation to avoid datasets with extra fields
        for (var k in annotationOnlyDataFields) {
          matches.push(String(dataPoint[k]) === String(annotation[k]));
        }
        let everyIsTrue = matches.every((e) => e );
        if ( everyIsTrue ) {
          matchingDataPoint = dataPoint;
        }       
      });
      if (annotation.annotated === "A") {
        matchingDataPoint.annotated = annotation.annotated;
      } else if (annotation.annotated === "B") {  // Should be annotated2 in the backend
        matchingDataPoint.annotated2 = annotation.annotated;
      }
    });
    }
  try {
    plot(elm, spec, cleanedDataset, question, successHandler, errorHandler, "svg");
  } catch (e) {
    console.log('Error in plot');
  }
}

function isValidString(n) {
  return n.match(/\./g) <= 1;  // Currently only checking if a string has more than one zero
}

function formatFieldName(n) {
  if (n) {
    if (!isValidString(n)) {
      n.replace(/\./g, "_");
    }
    return n.replace(/\./g, "\\.").replace(/\[/g, "\\[").replace(/\]/g, "\\]").replace(/(\r\n|\n|\r|\t)/gm, "");
  } else {
    return '';
  }
}

export function plot(elm, partialSpec, dataset, question, successHandler, errorHandler, renderer = "svg" ){
  return new Promise((resolve, reject)=>{

    let vl = copy(partialSpec);

    // Populate partial specification
    Object.keys(vl.encoding).forEach(ch=>{
      const vlField = vl.encoding[ch].field;

      let dataField = "name";
      if (vlField === "Q1") {
        dataField = question.q1;
      } else if (vlField === "Q2") {
        dataField = question.q2;
      } else if (vlField === "name") {
        dataField = question.c;
      }

      vl.encoding[ch].field = formatFieldName(dataField);

      if (["size", "color", "shape"].contains(ch)) {  // Size, color, shape
        vl.encoding[ch].legend = {"title": dataField};
      } else if (["row", "column"].contains(ch)) {  // Shelves
        vl.encoding[ch].header = {"title": dataField};
      } else {  // Positional
        vl.encoding[ch].axis = {
          "title": dataField,
        };
      }

      if (["x", "y", "size"].contains(ch)) {
        let zero = startAtZero(dataField, dataset);
        vl.encoding[ch].scale = {
          "zero": zero
        }
      }

      if (ch === "color" && vlField === "name") {
        if (question.cardinality <= 10) {
          vl.encoding[ch].scale = {"scheme": "tableau10"};
        } else {
          vl.encoding[ch].scale = {"scheme": "tableau20"};
        }
      }
    });

    vl.data = {"values": dataset };
    vegaEmbed(elm, vl, {
      "actions": false,
      "renderer": renderer,
      "onBeforeParse": annotate
    }).then(result => {
      let view = result.view;
      successHandler();
      resolve(result);
    }).catch(error => {
      console.error('Vega error:', error);
      errorHandler();
      reject(error);
    });
  });
}

function annotate(vg){
  let annotated = copy(vg);
  let givenData = vg.data[0].values;

  let annotatedA = givenData.filter(d => d.annotated === 'A')[0];
  let annotatedB = givenData.filter(d => d.annotated2 === 'B')[0];

  if (!annotatedA) {
    return vg;
  }
  if (annotatedA === annotatedB) {
    throw 'A and B annotate the same point';
  }  
  annotatedA = copy(annotatedA);
  annotatedA.id = "";
  if (annotatedB) {
    annotatedB = copy(annotatedB);
    annotatedB.id = "2";
  }

  let marks, basicMark;
  if (annotated.marks.map(d=> d.name).indexOf("cell") < 0) {
    annotated.data.push({
      "name": "annotatedData",
      "source": "source_0",
      "transform": [
        {
          "type": "filter",
          "expr": "datum.annotated"
        }
      ]
    });
    annotated.data.push({
      "name": "annotatedData2",
      "source": "source_0",
      "transform": [
        {
          "type": "filter",
          "expr": "datum.annotated2"
        }
      ]
    });
    marks = annotated.marks;
    basicMark = annotated.marks[0];
  } else {
    let cellMark = annotated.marks.filter(mark => mark.name ==="cell")[0];
    cellMark.data = [{
      "name": "annotatedData",
      "source": "facet",
      "transform":[{
        "type":"filter",
        "expr":"datum.annotated"
      }]
    }];
    cellMark.data.push({
      "name": "annotatedData2",
      "source": "facet",
      "transform":[{
        "type":"filter",
        "expr":"datum.annotated2"
      }]
    });
    marks = cellMark.marks;
    basicMark = cellMark.marks[0];
  }

  
  // If B is annotated 
  if (!!annotatedB) {
    let xField = basicMark.encode.update.x.field;
    let yField = basicMark.encode.update.y.field;
    let xRange = xField !== "name" ? getXYRange(xField, givenData) : undefined;
    let xNames = xField !== "name" ? undefined : givenData.map(d=> d.name).unique().sort();
    let yNames = yField !== "name" ? undefined : givenData.map(d=> d.name).unique().sort();
    let yRange = yField !== "name" ? getXYRange(yField, givenData) : undefined;
    if(xField !== "name" || xNames.indexOf(annotatedB[xField]) !== xNames.indexOf(annotatedA[xField]))  {
      let right = annotatedB;
      let left = annotatedA;
      if (
        (xNames && xNames.indexOf(annotatedB[xField]) < xNames.indexOf(annotatedA[xField])) ||
        (!xNames && (annotatedB[xField] < annotatedA[xField]))
      ) {
        right = annotatedA;
        left = annotatedB;
      }
      if (
        (xNames && xNames.indexOf(right[xField])===xNames.length-1) ||
        (!xNames && (xRange[1]-xRange[0])*0.8+xRange[0] < right[xField]) // If the right is too right.
      ) {
        if (
          (xNames && xNames.indexOf(left[xField])===0) ||
          (!xNames && left[xField] < (xRange[1]-xRange[0])*0.2+xRange[0]) // If the left is too left.
        ) {
          addAnnotation(Math.PI / 6, 20, left.id, 3);
          addAnnotation(Math.PI - Math.PI / 3, 14, right.id);
        } else {
          if (
            (!xNames && !yNames && ((left[xField] - right[xField]) / (xRange[1]-xRange[0]) / (left[yField] - right[yField]) * (yRange[1]-yRange[0]) > 1 )) ||
            (yNames && (yNames.indexOf(left.name) < yNames.indexOf(right.name)))
          ) {
            addAnnotation(Math.PI - Math.PI / 3, 14, left.id);
            addAnnotation(Math.PI - Math.PI / 6, 20, right.id, 3);
          } else {
            addAnnotation(Math.PI - Math.PI / 6, 20, left.id, 3);
            addAnnotation(Math.PI - Math.PI / 3, 14, right.id);
          }
        }
      } else {
        if (
            (!xNames && !yNames && ((right[xField] - left[xField]) / (xRange[1]-xRange[0]) / (right[yField] - left[yField]) * (yRange[1]-yRange[0]) > 1 )) ||
            (yNames && (yNames.indexOf(right.name) < yNames.indexOf(left.name)))
          ) {
          addAnnotation(Math.PI / 3, 14, right.id);
          addAnnotation(Math.PI / 6, 20, left.id, 3);
        } else {
          addAnnotation(Math.PI / 6, 20, right.id, 3);
          addAnnotation(Math.PI / 3, 14, left.id);
        }
      }

    } else {
      let top = annotatedB;
      let bottom = annotatedA;
      if (annotatedB[yField] < annotatedA[yField]) {
        top = annotatedA;
        bottom = annotatedB;
      }
      if (xNames.indexOf(top[xField])===xNames.length-1) {
        addAnnotation(Math.PI - Math.PI / 3, 14, top.id);
        addAnnotation(Math.PI - Math.PI / 6, 20, bottom.id, 3);
      } else {
        addAnnotation(Math.PI / 3, 14, top.id);
        addAnnotation(Math.PI / 6, 20, bottom.id, 3);
      }

    }
  } else {
    addAnnotation(Math.PI / 3, 14, "");
  }


  function addAnnotation(angle, length, id, dy){

    let annotationLine = {
      "name": `annotation${id}-line`,
      "type": "rule",
      "role": "line",
      "from": {
        "data": `annotatedData${id}`
      },
      "encode": {
        "update" : {
          "x" : copy(basicMark.encode.update.x),
          "y" : copy(basicMark.encode.update.y),
          "x2" : copy(basicMark.encode.update.x),
          "y2" : copy(basicMark.encode.update.y),
          "stroke": {"value": "#000"}
        }
      }
    };

    if (basicMark.encode.update.size) {
      let xField = basicMark.encode.update.x.field;
      let yField = basicMark.encode.update.y.field;
      let sizeField = basicMark.encode.update.size.field;

      annotationLine.encode.update.x = { "signal": `scale('x', datum['${xField}']) + sqrt(scale('size', datum['${sizeField}']))/2*cos(${angle})` };
      annotationLine.encode.update.x2 = { "signal": `scale('x', datum['${xField}']) + sqrt(scale('size', datum['${sizeField}']))/2*cos(${angle})` };
      annotationLine.encode.update.y = { "signal": `scale('y', datum['${yField}']) - sqrt(scale('size', datum['${sizeField}']))/2*sin(${angle})` };
      annotationLine.encode.update.y2 = { "signal": `scale('y', datum['${yField}']) - sqrt(scale('size', datum['${sizeField}']))/2*sin(${angle})` };     
      annotationLine.encode.update.x2.offset = {"signal": `(${length} - sqrt(scale('size', datum['${sizeField}']))/2)* cos(${angle})`};
      annotationLine.encode.update.y2.offset = {"signal": `(-${length} + sqrt(scale('size', datum['${sizeField}']))/2)* sin(${angle})`};
    } else {
      annotationLine.encode.update.x.offset = Math.sqrt(30) / 2 * Math.cos(angle);
      annotationLine.encode.update.y.offset = - Math.sqrt(30) / 2 * Math.sin(angle);
      annotationLine.encode.update.x2.offset = length * Math.cos(angle);
      annotationLine.encode.update.y2.offset = -length * Math.sin(angle);
    }

    marks.push(annotationLine);

    let annotationText = {
      "name": `annotation${id}-text`,
      "type": "text",
      "role": "text",
      "from": {
        "data": `annotatedData${id}`
      },
      "encode": {
        "update" : {
          "text":{"field": `annotated${id}`},
          "fontWeight": { "value": "bold" },
          "fontSize": { "value": 12 },
          "fill": {"value": "#000"},
          "stroke": {"value": "#fff"},
          "strokeWidth": {"value": 0.3},
          "x" : copy(annotationLine.encode.update.x2),
          "y" : copy(annotationLine.encode.update.y2),
        }
      }
    };
    if (!!dy) {
      annotationText.encode.update.dy = {"value": dy};
    }
    if (angle > Math.PI / 2 && angle < 3 * Math.PI / 2) {
      annotationText.encode.update.align = {"value": "right"};
    }
    marks.push(annotationText);
  }
  

  return annotated;
}