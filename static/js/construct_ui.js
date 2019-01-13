//For String formatting
String.prototype.format = function() {
  var args = arguments;
  return this.replace(/{(\d+)}/g, function(match, number) {
    return typeof args[number] != 'undefined' ? args[number] : match;
  });
};



function create_mic_panel(parent, id, i=-1){
  //Creating a microphone panel setup
  if(i == -1){ i = parent.children.length - 1 }
  parent.append(Panel(id, i, "Microphones"))
  body = $('#{0}-body-{1}'.format(id, i))

  //Remove delete button if first
  if(i == 0){ $('#{0}-del-{1}'.format(id, i)).remove() }
  if( i > 0){
    // Add functionality to delete button
    $($('#{0}-del-{1}'.format(id, i))).click(function(){
      remove_element('{0}-{1}'.format(id, i))
    })
  }

  //Creating the controls
  create_number_input(body, "ID", i, 1.0, true)
  create_vector3_input(body, "Position", "POS", 0, 0.25, "pos")
  create_vector3_input(body, "Rotation", "ROT", 0, 5, "rot")

  //MIC STYLE
}

function create_mot_panel(parent, id, i=-1){
  //Creating a motor-setup panel
  //Creating a microphone panel setup
  if(i == -1){  i = parent.children.length - 1 }
  parent.append(Panel(id, i, "Motors"))
  body = $('#{0}-body-{1}'.format(id, i))

  //Remove delete button if first
  if(i == 0){ $('#{0}-del-{1}'.format(id, i)).remove() }
  if( i > 0){
    // Add functionality to delete button
    $($('#{0}-del-{1}'.format(id, i))).click(function(){
      remove_element('{0}-{1}'.format(id, i))
    })
  }

  //Creating the controls
  create_number_input(body, "ID", i, 1.0, true, "id")
  create_vector3_input(body, "Position", "POS", 0, 0.25, "pos")

  body.append("<p>TODO ADD MOTOR NOISE</p>")
}


function create_src_panel(parent, id, i=-1){
  //Creating a src-setup panel
  if(i == -1){  i = parent.children.length - 1 }

  opts = ["single", "box", "pyramid", "sphere"]
  parent.append(Panel(id, i, SelectInput("{0}-{1}".format(id, i), opts)))
  body = $('#{0}-body-{1}'.format(id, i))

  //Remove delete button if first
  if(i == 0){ $('#{0}-del-{1}'.format(id, i)).remove() }
  if( i > 0){
    // Add functionality to delete button
    $($('#{0}-del-{1}'.format(id, i))).click(function(){
      remove_element('{0}-{1}'.format(id, i))
    })
  }

  toprow = $('#{0}-tr-{1}'.format(id, i))
  body = $('#{0}-body-{1}'.format(id, i))

  // toprow.append(SelectInput("{0}-{1}".format(id, i), opts))

  $('#{0}-{1}-sel'.format(id, i)).change(function(){
    val = $('#{0}-{1}-sel option:selected'.format(id, i))[0].value
    $('#{0}-pyramid-{1}'.format(id, i)).hide()
    $('#{0}-box-{1}'.format(id, i)).hide()
    $('#{0}-sphere-{1}'.format(id, i)).hide()
    $('#{0}-single-{1}'.format(id, i)).hide()

    $('#{0}-{2}-{1}'.format(id, i, val)).show()
  })


  //Create the main controls for each
  create_singlesrc_controls(body, id, i)
  create_box_controls(body, id, i)
  create_pyramid_controls(body, id, i)
  create_sphere_controls(body, id, i)
  //Only box should be shown by default
  $('#{0}-pyramid-{1}'.format(id, i)).hide()
  $('#{0}-sphere-{1}'.format(id, i)).hide()
  $('#{0}-box-{1}'.format(id, i)).hide()

}


function create_box_controls(parent, id, i){
  //Create the controls for a box src-setup
  parent.append('<div id="{0}-box-{1}"></div>'.format(id, i))
  create_vector3_input($("#{0}-box-{1}".format(id, i)), "Dimensions", "DIM", def_val=1.0, def_step=0.25, "dim")
  create_vector3_input($("#{0}-box-{1}".format(id, i)), "Divisions", "DIM", def_val=2.0, def_step=1.0, "div")
  create_vector3_input($("#{0}-box-{1}".format(id, i)), "Origin", "POS", def_val=2.5, def_step=0.25, "pos")

}

function create_sphere_controls(parent, id, i){
  parent.append('<div id="{0}-sphere-{1}"></div>'.format(id, i))
  create_number_input($('#{0}-sphere-{1}'.format(id, i)), "Rings", def_val=4.0, def_step=1.0, "rings")
  create_number_input($('#{0}-sphere-{1}'.format(id, i)), "Segments", def_val=8.0, def_step=1.0, "segs")
  create_number_input($('#{0}-sphere-{1}'.format(id, i)), "Radius", def_val=8.0, def_step=0.25, "rad")
  create_vector3_input($("#{0}-sphere-{1}".format(id, i)), "Origin", "POS", def_val=2.5, def_step=0.25, "pos")
}

function create_pyramid_controls(parent, id, i){
  //Create the controls for a pyramid src-setup
  parent.append('<div id="{0}-pyramid-{1}"></div>'.format(id, i))
  create_number_input($('#{0}-pyramid-{1}'.format(id, i)), "Layers", def_val=3.0, def_step=1.0, "lays")
  create_number_input($('#{0}-pyramid-{1}'.format(id, i)), "Divisions", def_val=4.0, def_step=1.0, "divs")
  create_number_input($('#{0}-pyramid-{1}'.format(id, i)), "Length", def_val=8.0, def_step=0.25, "len")
  create_number_input($('#{0}-pyramid-{1}'.format(id, i)), "Angle", def_val=30, def_step=5, "ang")
  create_vector3_input($("#{0}-pyramid-{1}".format(id, i)), "Origin", "POS", def_val=2.5, def_step=0.25, "pos")

}

function create_singlesrc_controls(parent, id, i){
  //Create the controls for a pyramid src-setup
  parent.append('<div id="{0}-single-{1}"></div>'.format(id, i))
  create_vector3_input($("#{0}-single-{1}".format(id, i)),"Position", "POS", def_val=2.5, def_step=0.25, "pos")
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
Vector3Input = function(label, id, def_val=0.0, def_step=0.25, style="POS"){
  inp_1 = NumberInput(V3Styles(style).first, "{0}-{1}".format(id, V3Styles(style).first), def_val, def_step, false)
  inp_2 = NumberInput(V3Styles(style).second, "{0}-{1}".format(id, V3Styles(style).second), def_val, def_step, false)
  inp_3 = NumberInput(V3Styles(style).third, "{0}-{1}".format(id, V3Styles(style).third), def_val, def_step, false)

  return '<hr/> \
          <p class="text-secondary">{0}</p> \
          <div id="{1}" class="row input-group mx-0"> \
            {2} {3} {4} \
          </div>'.format(label, id, inp_1, inp_2, inp_3)
}

//  HTML template for a Number input
//  use_outer_div = true will put it in an individual input group
NumberInput = function(label, id, def_val, def_step, use_outer_div = true){
  start = '<div class="input-group">'
  end = '</div>'
  if(use_outer_div == true){
    return start + NumberInput(label, id, def_val, def_step, false) + end
  }
  else{
    return '<div class="input-group-prepend">\
              <p class="text-info input-group-text">{0}</p> \
            </div> \
            <input class="form-control pr-0" type="number" value="{1}" step="{2}" id="{3}"/> \
             '.format(label, def_val, def_step, "{0}-val".format(id))
  }
}

// HTML Tempalte for a select input
SelectInput = function(id, options){
  optionsHTML = ''
  for(i=0;i<options.length; i++){
    optionsHTML += '<option value="{0}">{0}</option>\n'.format(options[i])
  }

  return '<select id="{0}-sel" class="w-100">\
          {1} \
          </select>'.format(id, optionsHTML)
}

// HTML Template for a span containing an fas icon
FASIcon = function(iconName){
  return '<span class="fas fa-{0}"></span>'.format(iconName)
}

// HTML Tempalte for a collapsing panel
Panel = function(id, index, title){
  return '<div id="{0}-{1}"> \
    <div class="row input-group mx-0" id="{0}-tr-{1}"> \
      <h5 class="text-secondary col-md-10 p-0">{4}</h5> \
      <button class="btn btn-info col-md-1 p-0" id="{0}-col-{1}" data-toggle="collapse" data-target="#{0}-body-{1}" aria-example="True" aria-controls="{0}-body-{1}">{3}</button> \
      <button class="btn btn-danger col-md-1 -p-0" id="{0}-del-{1}">{2}</button> \
    </div> \
    <div class="collapse" id="{0}-body-{1}"> \
    </div> \
  </div>'.format(id, index, FASIcon("minus"), FASIcon("sort-down"), title)
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
    parent.append(Vector3Input(label, parent[0].id, def_val, def_step, style))
  else
    parent.append(Vector3Input(label, parent[0].id+"-{0}".format(id_suffix), def_val, def_step, style))
}

//Creates a basic number input with a label
function create_number_input(parent, label, def_val=0.0, def_step=0.25, id_suffix=""){
  if(id_suffix == "")
    parent.append(NumberInput(label, parent[0].id, def_val, def_step))
  else
    parent.append(NumberInput(label, parent[0].id+"-{0}".format(id_suffix), def_val, def_step))
}
