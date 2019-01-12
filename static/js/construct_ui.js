//For String formatting
String.prototype.format = function() {
  var args = arguments;
  return this.replace(/{(\d+)}/g, function(match, number) {
    return typeof args[number] != 'undefined' ? args[number] : match;
  });
};





label_class_3 = "col-md-2 text-info input-group-text"
input_class_3 = "col-md-2 px-0"

label_class_1 = "col-md-4 text-info input-group-text"
input_class_1 = "col-md-8 px-0"

fasicon = '<span class="fas fa-{0}"></span>'

function create_mic_panel(parent, id, i=-1){
  //Creating a mic-setup panel
  panel = '<div id="{0}-{1}" ></div>'
  row = '<div class="row input-group mx-0" id="{0}-tr-{1}"></div>'
  body = '<div class="collapse" id="{0}-body-{1}"></div>'
  del = '<button class="btn btn-{0} {4}" id="{1}-del-{2}">{3}</button>'
  col = '<button class="btn btn-{0} {4}" id="{1}-col-{2}" data-toggle="collapse" data-target="#{1}-body-{2}" aria-example="True" aria-controls="{1}-body-{2}">{3}</button>'
  control_lbl = '<hr><p class="text-secondary">{0}</p><div class="row input-group mx-0" id="{1}"><div>'
  control = '<hr><div class="row input-group mx-0" id="{0}"><div>'

  if(i == -1){  i = parent.children.length - 1 }

  parent.append(panel.format(id, i))
  panel = $('#{0}-{1}'.format(id, i))

  panel.append(row.format(id, i))
  toprow = $('#{0}-tr-{1}'.format(id, i))
  panel.append(body.format(id, i))
  body = $('#{0}-body-{1}'.format(id, i))

  //Collapse and delete buttons
  toprow.append('<h5 class="text-secondary col-md-10 py-1">Microphone</h5>')
  toprow.append(col.format("info", id, i, fasicon.format("sort-down"), "col-md-1"))
  if( i > 0){
    toprow.append(del.format("danger", id, i, fasicon.format("minus"), "col-md-1")) //Add the delete button
    $($('#{0}-del-{1}'.format(id, i))).click(function(){ remove_element('{0}-{1}'.format(id, i)) })
  }

  //Creating the controls
  create_number_input(body, "ID", i, 1.0, true)
  create_vector3_input(body, "Position", 0, 0.25, "POS")
  create_vector3_input(body, "Rotation", '{0}-rot-{1}'.format(id, i), 0, 5, "ROT")

  //MIC STYLE
}

function create_mot_panel(parent, id, i=-1){
  //Creating a motor-setup panel
  panel = '<div id="{0}-{1}" ></div>'
  row = '<div class="row input-group mx-0" id="{0}-tr-{1}"></div>'
  body = '<div class="collapse" id="{0}-body-{1}"></div>'
  del = '<button class="btn btn-{0} {4}" id="{1}-del-{2}">{3}</button>'
  col = '<button class="btn btn-{0} {4}" id="{1}-col-{2}" data-toggle="collapse" data-target="#{1}-body-{2}" aria-example="True" aria-controls="{1}-body-{2}">{3}</button>'
  control_lbl = '<hr><p class="text-secondary">{0}</p><div class="row input-group mx-0" id="{1}"><div>'
  control = '<hr><div class="row input-group mx-0" id="{0}"><div>'

  if(i == -1){  i = parent.children.length - 1 }

  parent.append(panel.format(id, i))
  panel = $('#{0}-{1}'.format(id, i))

  panel.append(row.format(id, i))
  toprow = $('#{0}-tr-{1}'.format(id, i))
  panel.append(body.format(id, i))
  body = $('#{0}-body-{1}'.format(id, i))

  //Collapse and delete buttons
  toprow.append('<h5 class="text-secondary col-md-10 py-1">Motor</h5>')
  toprow.append(col.format("info", id, i, fasicon.format("sort-down"), "col-md-1"))
  if( i > 0){
    toprow.append(del.format("danger", id, i, fasicon.format("minus"), "col-md-1")) //Add the delete button
    $($('#{0}-del-{1}'.format(id, i))).click(function(){ remove_element('{0}-{1}'.format(id, i)) })
  }

  //Creating the controls
  create_number_input(body, "ID", i, 1.0)
  create_vector3_input(body, "Position", 0, 0.25, "POS")

  body.append("<p>TODO ADD MOTOR NOISE</p>")
}


function create_src_panel(parent, id, i=-1){
  //Creating a src-setup panel
  panel = '<div id="{0}-{1}" ></div>'
  row = '<div class="row input-group mx-0" id="{0}-tr-{1}"></div>'
  body = '<div class="collapse" id="{0}-body-{1}"></div>'
  sel = '<select id="{0}-sel-{1}" class="{2}"/>'
  opt = '<option value="{0}">{0}</option'
  del = '<button class="btn btn-{0} {4}" id="{1}-del-{2}">{3}</button>'
  col = '<button class="btn btn-{0} {4}" id="{1}-col-{2}" data-toggle="collapse" data-target="#{1}-body-{2}" aria-example="True" aria-controls="{1}-body-{2}">{3}</button>'

  if(i == -1){  i = parent.children.length - 1 }

  parent.append(panel.format(id, i))
  panel = $('#{0}-{1}'.format(id, i))

  panel.append(row.format(id, i))
  toprow = $('#{0}-tr-{1}'.format(id, i))
  panel.append(body.format(id, i))
  body = $('#{0}-body-{1}'.format(id, i))

  //Select
  toprow.append(sel.format(id, i, "col-md-10"))
  $('#{0}-sel-{1}'.format(id, i)).append(opt.format("single"))
  $('#{0}-sel-{1}'.format(id, i)).append(opt.format("box"))
  $('#{0}-sel-{1}'.format(id, i)).append(opt.format("pyramid"))
  $('#{0}-sel-{1}'.format(id, i)).append(opt.format("sphere"))
  $('#{0}-sel-{1}'.format(id, i)).change(function(){
    val = $('#{0}-sel-{1} option:selected'.format(id, i))[0].value
    $('#{0}-pyramid-{1}'.format(id, i)).hide()
    $('#{0}-box-{1}'.format(id, i)).hide()
    $('#{0}-sphere-{1}'.format(id, i)).hide()
    $('#{0}-single-{1}'.format(id, i)).hide()

    $('#{0}-{2}-{1}'.format(id, i, val)).show()
  })

  //Collapse and delete buttons
  toprow.append(col.format("info", id, i, fasicon.format("sort-down"), "col-md-1"))
  if( i > 0){
    toprow.append(del.format("danger", id, i, fasicon.format("minus"), "col-md-1"))

    $($('#{0}-del-{1}'.format(id, i))).click(function(){
      remove_element('{0}-{1}'.format(id, i))
    })
  }

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
  div = '<div id="{0}-box-{1}"></div>'
  control = '<hr><p class="text-secondary">{0}</p><div class="row input-group mx-0" id="{1}"><div>'
  parent.append(div.format(id, i))
  container = $('#{0}-box-{1}'.format(id, i))

  container.append(control.format("Dimensions", "{0}-box-dim-{1}".format(id, i)))
  create_dimension_input("{0}-box-dim-{1}".format(id, i), def_val=1.0, def_step=0.25)

  container.append(control.format("Divisions", "{0}-box-div-{1}".format(id, i)))
  create_dimension_input("{0}-box-div-{1}".format(id, i), def_val=2.0, def_step=1.0)

  container.append(control.format("Origin", "{0}-box-pos-{1}".format(id, i)))
  create_position_input("{0}-box-pos-{1}".format(id, i), def_val=2.5, def_step=0.25)

}

function create_sphere_controls(parent, id, i){
  //Create the controls for a sphere src-setup
  div = '<div id="{0}-sphere-{1}"></div>'
  control_lbl = '<hr><p class="text-secondary">{0}</p><div class="row input-group mx-0" id="{1}"><div>'
  control = '<hr><div class="row input-group mx-0" id="{0}"><div>'
  parent.append(div.format(id, i))
  container = $('#{0}-sphere-{1}'.format(id, i))

  container.append(control.format('{0}-sphere-rings-{1}'.format(id, i)))
  create_number_input('{0}-sphere-rings-{1}'.format(id, i), "Rings", def_val=4.0, def_step=1.0)

  container.append(control.format('{0}-sphere-segs-{1}'.format(id, i)))
  create_number_input('{0}-sphere-segs-{1}'.format(id, i), "Segments", def_val=8.0, def_step=1.0)

  container.append(control.format('{0}-sphere-rad-{1}'.format(id, i)))
  create_number_input('{0}-sphere-rad-{1}'.format(id, i), "Radius", def_val=8.0, def_step=0.25)

  container.append(control_lbl.format("Origin", "{0}-sphere-pos-{1}".format(id, i)))
  create_position_input("{0}-sphere-pos-{1}".format(id, i), def_val=2.5, def_step=0.25)
}

function create_pyramid_controls(parent, id, i){
  //Create the controls for a pyramid src-setup
  div = '<div id="{0}-pyramid-{1}"></div>'
  control_lbl = '<hr><p class="text-secondary">{0}</p><div class="row input-group mx-0" id="{1}"><div>'
  control = '<hr><div class="row input-group mx-0" id="{0}"><div>'
  parent.append(div.format(id, i))
  container = $('#{0}-pyramid-{1}'.format(id, i))


  container.append(control.format('{0}-pyr-lays-{1}'.format(id, i)))
  create_number_input('{0}-pyr-lays-{1}'.format(id, i), "Layers", def_val=3.0, def_step=1.0)

  container.append(control.format('{0}-pyr-divs-{1}'.format(id, i)))
  create_number_input('{0}-pyr-divs-{1}'.format(id, i), "Divisions", def_val=4.0, def_step=1.0)

  container.append(control.format('{0}-pyr-len-{1}'.format(id, i)))
  create_number_input('{0}-pyr-len-{1}'.format(id, i), "Length", def_val=8.0, def_step=0.25)

  container.append(control.format('{0}-pyr-ang-{1}'.format(id, i)))
  create_number_input('{0}-pyr-ang-{1}'.format(id, i), "Angle", def_val=30, def_step=5)

  container.append(control_lbl.format("Origin", "{0}-pyr-pos-{1}".format(id, i)))
  create_position_input("{0}-pyr-pos-{1}".format(id, i), def_val=2.5, def_step=0.25)

}

function create_singlesrc_controls(parent, id, i){
  //Create the controls for a pyramid src-setup
  div = '<div id="{0}-single-{1}"></div>'
  control_lbl = '<hr><p class="text-secondary">{0}</p><div class="row input-group mx-0" id="{1}"><div>'

  parent.append(div.format(id, i))
  container = $('#{0}-single-{1}'.format(id, i))
  container.append(control_lbl.format("Position", "{0}-sin-pos-{1}".format(id, i)))
  create_position_input("{0}-sin-pos-{1}".format(id, i), def_val=2.5, def_step=0.25)
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
  if(style = "ROT"){ return this.ROT() }
  if(style = "DIM"){ return this.DIM() } 
}



// ====== Classes for Input Groups ====== //

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

// ====== Functions To add Input Groups to the pages ===== //

//Creates a vector 3 input with labels X, Y, and Z
function create_vector3_input(parent, label, style, def_val=0.0, def_step=0.25){
  parent.append(Vector3Input(label, parent.id, def_val, def_step, style))
}

//Creates a basic number input with a label
function create_number_input(parent, label, def_val=0.0, def_step=0.25){
  parent.append(NumberInput(label, parent.id, def_val, def_step))
}
