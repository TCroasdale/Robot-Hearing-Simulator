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



function attachEvents(node, events){
  var children = node.children;
  for (var i = 0; i < children.length; i++) {
    var child = children[i];

    //Attach events to the children as well
    attachEvents(child, events)
    for(var j = 0; j < child.attributes.length; j++){
      attr = child.attributes[j]
      found = attr.name.match(/ev-([a-z]+)/) // Looks for attribute ev-{event name}
      if(found != null){
        //Attach an event listener to the element
        //found[1] is the event type, such as change or click, should work for custom events too
        let fn = events[child.getAttribute(found[0])]
        $('#{0}'.format(child.id)).on(found[1], fn)
        child.removeAttribute(found[0])
      }
    }
  }
}

function formatAttributes(node, opts){
  var children = node.children;
  for(var j = 0; j < node.attributes.length; j++){
    node.setAttribute(node.attributes[j].name, node.attributes[j].value.smartFormat(opts))
  }
  for (var i = 0; i < children.length; i++) {
    var child = children[i];

    //Attach events to the children as well
    formatAttributes(child, opts)
    for(var j = 0; j < child.attributes.length; j++){
      child.setAttribute(child.attributes[j].name, child.attributes[j].value.smartFormat(opts))
    }
  }
}

//Clones a template into the page, with dictionary options
function appendTemplate(parent, panelID, options, events){
  //Test for browser support
  if('content' in document.createElement('template')){
    var panel = $("#{0}".format(panelID))

    if(panel[0].content != undefined){
      parent.append(document.importNode(panel[0].content, true))

      formatAttributes(parent[0].lastElementChild, options)
      attachEvents(parent[0].lastElementChild, events)
    }
    else{
      console.log("Couldn't find template")
    }
  }
}



function set_vec3_input(id, obj, type="POS"){
  style = V3Styles(type)


  set_number_input('{0}-{1}'.format(id, style.first), obj['x'])
  set_number_input('{0}-{1}'.format(id, style.second), obj['y'])
  set_number_input('{0}-{1}'.format(id, style.third), obj['z'])
}

function set_number_input(id, value){
  if (isNaN(value)){
    $('#{0}-val'.format(id))[0].disabled = true
  }else{
    $('#{0}-val'.format(id))[0].disabled = false
    $('#{0}-val'.format(id)).val(value)
  }
}

function set_selection_input(id, i, val){
  $('#{0}-sel-{1}'.format(id, i)).val(val)
}

// Functions for reading the inputs
// returns JSON objects
function read_vec3_input(id, type="POS", fallback={ "x": 0.0, "y": 0.0, "z": 0.0}){
  style = V3Styles(type)

  input = fallback//{ "x": "0.0", "y": "0.0", "z": "0.0"}
  input['x'] = read_num_input("{0}-{1}".format(id, style.first), fallback['x'])
  input['y'] = read_num_input("{0}-{1}".format(id, style.second), fallback['y'])
  input['z'] = read_num_input("{0}-{1}".format(id, style.third), fallback['z'])

  return input
}

function read_num_input(id, fallback=0.0){
  if($("#{0}-val".format(id))[0].disabled){
     return fallback
  }
  return Number($("#{0}-val".format(id))[0].value)
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

  if(style == "POS"){ return this.POS() }
  else if(style == "ROT"){ return this.ROT() }
  else if(style == "DIM"){ return this.DIM() }
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
    var id = this.id + (this.hasAttribute("id-suffix") ? "-" + this.getAttribute('id-suffix') : "");
    this.innerHTML = numberInput(this.getAttribute('label'), id, this.getAttribute('value'), this.getAttribute('step'))
  }
}
class Vector3Input extends HTMLElement{
  constructor(){
    super()
    var id = this.id + (this.hasAttribute("id-suffix") ? "-" + this.getAttribute('id-suffix') : "");
    this.innerHTML = vector3Input(this.getAttribute('label'), id, this.getAttribute('value'), this.getAttribute('step'), this.getAttribute('label-style'))
  }
}

customElements.define('fas-icon', FasIcon)
customElements.define('number-input', NumberInput)
customElements.define('vec3-input', Vector3Input)
