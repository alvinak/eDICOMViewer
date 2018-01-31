import $ from 'jquery';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import menu from './menu.js';
import nodeDCMTK from './nodeDCMTK.js';

//call test_sum
var result = nodeDCMTK.test_sum(3,4);
console.log("3+4=" + result);

//call test_parameter_string
nodeDCMTK.test_parameter_string('test1234');

//call test_return_string
console.log("test_return_string::" + nodeDCMTK.test_return_string(1.9876));

//call test_loaddcm
nodeDCMTK.test_loaddcm();
