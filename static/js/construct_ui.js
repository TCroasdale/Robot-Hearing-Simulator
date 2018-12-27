//For String formatting
String.prototype.format = function() {
  var args = arguments;
  return this.replace(/{(\d+)}/g, function(match, number) {
    return typeof args[number] != 'undefined' ? args[number] : match;
  });
};


label_class_3 = "col-md-2 text-info"
input_class_3 = "col-md-2"

label_class_1 = "col-md-4 text-info"
input_class_1 = "col-md-8"


function create_number_input(id, label, def_val=0.0, def_step=0.25){
  lbl = '<p class="{0}">{1}</p>'
  inp = '<input class="{0}" type="number" value="{1}" step="{2}" id="{4}-val"/>'

  parent = $('#{0}'.format(id))

  parent.append(lbl.format(label_class_1, label))
  parent.append(inp.format(input_class_1, def_val, def_step, id))
}

function create_position_input(id, def_val=0.0, def_step=0.25){
  lbl = '<p class="{0}">{1}</p>'
  inp = '<input class="{0}" type="number" value="{2}" step="{3}" id="{4}-{1}"/>'

  parent = $('#{0}'.format(id))

  parent.append(lbl.format(label_class_3, "X"))
  parent.append(inp.format(input_class_3, "X", def_val, def_step, id))
  parent.append(lbl.format(label_class_3, "Y"))
  parent.append(inp.format(input_class_3, "Y", def_val, def_step, id))
  parent.append(lbl.format(label_class_3, "Z"))
  parent.append(inp.format(input_class_3, "Z", def_val, def_step, id))
}

function create_dimension_input(id, def_val=0.0, def_step=0.25){
  lbl = '<p class="{0}">{1}</p>'
  inp = '<input class="{0}" type="number" value="{2}" step="{3}" id="{4}-{1}"/>'

  parent = $('#{0}'.format(id))

  parent.append(lbl.format(label_class_3, "W"))
  parent.append(inp.format(input_class_3, "W", def_val, def_step, id))
  parent.append(lbl.format(label_class_3, "H"))
  parent.append(inp.format(input_class_3, "H", def_val, def_step, id))
  parent.append(lbl.format(label_class_3, "D"))
  parent.append(inp.format(input_class_3, "D", def_val, def_step, id))
}
