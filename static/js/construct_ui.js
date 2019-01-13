//For String formatting
String.prototype.format = function() {
  var args = arguments;
  return this.replace(/{(\d+)}/g, function(match, number) {
    return typeof args[number] != 'undefined' ? args[number] : match;
  });
};

//For inserting arguments into strings, but from a dictionary
String.prototype.smartFormat = function(){
  var args = arguments;
  return this.replace(/{(\S+)}/gi, function(match, key) {
    return typeof args[0][key] != 'undefined' ? args[0][key] : match;
  });
}

//Clones a template into the page, with dictionary options
function appendTemplate(parent, panelID, options){
  //Test for browser support
  if('content' in document.createElement('template')){
    var panel = $("#{0}".format(panelID))

    if(panel[0].content != undefined){
      parent.append(document.importNode(panel[0].content, true))

      innerHTML = parent[0].innerHTML
      parent[0].innerHTML= innerHTML.smartFormat(options)
    }
    else{
      console.log("Couldn't find template")
    }
  }
}



function set_vec3_input(id, obj, type="XYZ"){
  set_number_input('{0}-{1}'.format(id, type[0])).val(obj['x'])
  set_number_input('{0}-{1}'.format(id, type[1])).val(obj['y'])
  set_number_input('{0}-{1}'.format(id, type[2])).val(obj['z'])
}

function set_number_input(id, val){
  $('#{0}-val'.format(id)).val(val)
}

function set_selection_input(id, i, val){
  $('#{0}-sel-{1}'.format(id, i)).val(val)
}

// Functions for reading the inputs
// returns JSON objects
function read_vec3_input(id, type="XYZ"){
  if(type != "XYZ" && type != "WHD" && type != "RYP"){
    console.log("invalid read type, reading using XYZ")
    type = "XYZ"
  }

  input = { "x": "0.0", "y": "0.0", "z": "0.0"}
  input['x'] = read_num_input("{0}-{1}".format(id, type[0]))
  input['y'] = read_num_input("{0}-{1}".format(id, type[0]))
  input['z'] = read_num_input("{0}-{1}".format(id, type[0]))

  return input
}

function read_num_input(id){
  return $("#{0}-val".format(id))[0].value
}

V3Styles = function(style){
  this.POS = function(){
    return Object.freeze({first: "X", second:  "Y", third: "Z"})
  }
  this.DIM = function(){
    return Object.freeze({first: "W", second:  "H", third: "D"})
  }
  this.ROT = function(){
    return Object.freeze({first: "Roll", second:  "Yaw", third: "Pitch"})
  }

  if(style = "POS"){ return this.POS() }
  else if(style = "ROT"){ return this.ROT() }
  else if(style = "DIM"){ return this.DIM() }
  else{ return this.POS() }
}



// ====== Classes for Input Groups ====== //

// HTML Template for a Vector3 input
function vector3Input(label, id, def_val=0.0, def_step=0.25, style="POS"){
  inp_1 = numberInput(V3Styles(style).first, "{0}-{1}".format(id, V3Styles(style).first), def_val, def_step, false)
  inp_2 = numberInput(V3Styles(style).second, "{0}-{1}".format(id, V3Styles(style).second), def_val, def_step, false)
  inp_3 = numberInput(V3Styles(style).third, "{0}-{1}".format(id, V3Styles(style).third), def_val, def_step, false)

  return '<hr/> \
          <p class="text-secondary">{0}</p> \
          <div id="{1}" class="row input-group mx-0"> \
            {2} {3} {4} \
          </div>'.format(label, id, inp_1, inp_2, inp_3)
}

//  HTML template for a Number input
//  use_outer_div = true will put it in an individual input group
function numberInput(label, id, def_val, def_step, use_outer_div = true){
  start = '<hr/ ><div class="input-group">'
  end = '</div>'
  if(use_outer_div == true){
    return start + numberInput(label, id, def_val, def_step, false) + end
  }
  else{
    return '<div class="input-group-prepend">\
              <p class="text-info input-group-text">{0}</p> \
            </div> \
            <input class="form-control pr-1" type="number" value="{1}" step="{2}" id="{3}"/> \
             '.format(label, def_val, def_step, "{0}-val".format(id))
  }
}


// HTML Template for a span containing an fas icon
function fasIcon(iconName){
  return '<span class="fas fa-{0}"></span>'.format(iconName)
}


// ====== Functions To add Input Groups to the pages ===== //
// Common Parameter Explanations:
/* label      =   The Text Label for the input
*  parent     =   The JQuery Object which the input will attach to
*  style      =   The Vector3 Label style to be used, "POS", "ROT", or "DIM"
*  id_suffix  =   A suffix to add to the id
*  def_val    =   The Default value
*  def_step   =   The Step size
*/


//Creates a vector 3 input with labels X, Y, and Z
function create_vector3_input(parent, label, style, def_val=0.0, def_step=0.25, id_suffix=""){
  if(id_suffix == "")
    parent.append(vector3Input(label, parent[0].id, def_val, def_step, style))
  else
    parent.append(vector3Input(label, parent[0].id+"-{0}".format(id_suffix), def_val, def_step, style))
}

//Creates a basic number input with a label
function create_number_input(parent, label, def_val=0.0, def_step=0.25, id_suffix=""){
  if(id_suffix == "")
    parent.append(numberInput(label, parent[0].id, def_val, def_step))
  else
    parent.append(numberInput(label, parent[0].id+"-{0}".format(id_suffix), def_val, def_step))
}


// ===== Custom HTML Element Handlesr ===== //
customElements = Window.customElements

class FasIcon extends HTMLElement{
  constructor(){
    super()
    this.innerHTML = fasIcon(this.getAttribute('icon-name'))
  }
}

class NumberInput extends HTMLElement{
  constructor(){
    super()
    this.innerHTML = numberInput(this.getAttribute('label'), this.id, this.getAttribute('value'), this.getAttribute('step'))
  }
}
class Vector3Input extends HTMLElement{
  constructor(){
    super()
    this.innerHTML = vector3Input(this.getAttribute('label'), this.id, this.getAttribute('value'), this.getAttribute('step'), this.getAttribute('label-style'))
  }
}

customElements.define('fas-icon', FasIcon)
customElements.define('number-input', NumberInput)
customElements.define('vec3-input', Vector3Input)
