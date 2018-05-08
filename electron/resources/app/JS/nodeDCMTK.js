var util = require('./util.js');
var vex = require('vex-js')
import 'vex-js/dist/css/vex.css';
import 'vex-js/dist/css/vex-theme-os.css';
import 'vex-js/dist/css/vex-theme-top.css';
vex.registerPlugin(require('vex-dialog'));


var oldPath = process.env.PATH;
///현재 path 기준은 electron.exe
var dllPath = '.\\dll';
process.env['PATH'] = `${process.env.PATH};${dllPath}`;
// binding to a nodeDCMTK functions...

var DcmFileFormat = ref.types.void 
var DcmFileFormatPtr = ref.refType(DcmFileFormat);
var DcmFileFormatPtrPtr = ref.refType(DcmFileFormatPtr);

var DcmElement = ref.types.void 
var DcmElementPtr = ref.refType(DcmElement);
var DcmElementPtrPtr = ref.refType(DcmElementPtr);

var DcmObject = ref.types.void 
var DcmObjectPtr = ref.refType(DcmObject);
var DcmObjectPtrPtr = ref.refType(DcmObjectPtr);

var longPtr = ref.refType('long');
var ushortPtr = ref.refType('uint16');
var ucharPtr = ref.refType('uchar');

var nodeDCMTK = ffi.Library('NodeDCMTK.dll', {
'test_sum': [ 'int', [ 'int', 'int' ]],
'test_parameter_string': [ 'void', ['string']],
'test_return_string': ['string', ['double']],
'test_loaddcm': [ 'void', ['string']],
'test_get_DcmFileFormat': [ DcmFileFormatPtr, ['string']],
'test_voidptr_paramter': [ 'void', [DcmFileFormatPtr]],
'OpenDcmFileFormat': ['int',['string',DcmFileFormatPtrPtr]],
'CloseDcmFileFormat': ['int',[DcmFileFormatPtr]],
'DumpDcmTag': ['int',[DcmFileFormatPtr]],
'GetElementCount': ['int',[DcmFileFormatPtr,longPtr]],
'GetElement': ['int',[DcmFileFormatPtr,'int', DcmElementPtrPtr]],
'GetElementGTag': ['int',[DcmElementPtr,ushortPtr]],
'GetElementETag': ['int',[DcmElementPtr,ushortPtr]],
'GetElementTagName': ['int',[DcmElementPtr,'char*']],
'GetElementStringValue': ['int',[DcmElementPtr,'char*']],
'GetElementVR': ['int',[DcmElementPtr,'char*']],
'IsLeafElement': ['int',[DcmElementPtr,ucharPtr]],
'GetDcmDataSet': ['int',[DcmFileFormatPtr, DcmObjectPtrPtr]],
'DcmObjectNextInContainer': ['int',[DcmObjectPtr, DcmObjectPtr, DcmObjectPtrPtr]],
'DcmObjectNextObjectTop': ['int',[DcmObjectPtr, DcmObjectPtrPtr]],
'SetElementValue': ['int',[DcmElementPtr, 'string']],
'SaveDcmFileFormat': ['int',[DcmFileFormatPtr, 'string']]
});

process.env['PATH'] = oldPath;

var ID2Elements = {};
var dcmFileFormat = null;

function loadDICOMFileHierarchy(fileName){
    ///기존 row 모두 제거
    elementTable.clear();
    ID2Elements = {};
    
    dcmFileFormat = ref.alloc(DcmFileFormatPtrPtr);
    if(!nodeDCMTK.OpenDcmFileFormat(fileName, dcmFileFormat))
        console.error('OpenDcmFileFormat failed!');

    var dataset = ref.alloc(DcmObjectPtrPtr);
    nodeDCMTK.GetDcmDataSet(dcmFileFormat.deref(), dataset);

    var nextObject = ref.alloc(DcmObjectPtrPtr);
    nodeDCMTK.DcmObjectNextInContainer(dataset.deref(), ref.NULL, nextObject);
    AddRowHierarchy(dataset.deref(), nextObject.deref(), 0, null, 0);
}

function closeDICOMFile(){
    if(dcmFileFormat != null)
    {
        nodeDCMTK.CloseDcmFileFormat(dcmFileFormat.deref());
        dcmFileFormat = null;
    }
}

function saveDICOMFile(fileName){
    if(dcmFileFormat != null)
        nodeDCMTK.SaveDcmFileFormat(dcmFileFormat.deref(), fileName);
}

function AddRowHierarchy(container, current, level, parentRow, id){
    if(ref.isNull(container) || ref.isNull(current))
        return;

    var isLeaf = ref.alloc('uchar');
    nodeDCMTK.IsLeafElement(current, isLeaf);

    ///If currnet tag is item tag, set parentRow to newRow. 
    var newRow = parentRow;
    if(!IsItemTag(current))
        newRow = AddTableRow(current, level, parentRow, id++, isLeaf.deref());

    if(isLeaf.deref() == 0)
    {
        if(!IsItemTag(current))
            newRow.nodes().to$().find("td.details-control").append("<div class='open-close-button'></div>");

        SetOpenClosed(newRow, 'opend');
        var nextTopObject = ref.alloc(DcmObjectPtrPtr);
        nodeDCMTK.DcmObjectNextObjectTop(current, nextTopObject);
        AddRowHierarchy(current, nextTopObject.deref(), level+1, newRow, id);
    }
    
    var nextObject = ref.alloc(DcmObjectPtrPtr);
    nodeDCMTK.DcmObjectNextInContainer(container, current, nextObject);
    AddRowHierarchy(container, nextObject.deref(), level, parentRow, id);
}

function IsRowOpend(row){
    return row.nodes().to$().hasClass('opend');
}

function IsRowClosed(row){
    return row.nodes().to$().hasClass('closed');
}

function SetOpenClosed(row, stat){
    if(stat.toLowerCase().indexOf('close') >= 0)
    {
        removeClass(row, 'opend');
        addClass(row, 'closed');
    }
    else if(stat.toLowerCase().indexOf('open') >= 0)
    {
        removeClass(row, 'closed');
        addClass(row, 'opend');
    }
}

function addClass(row, type){
    row.nodes().to$().addClass(type);
}

function removeClass(row, type){
    row.nodes().to$().removeClass(type);
}

function loadDICOMFile(fileName){
    ///기존 row 모두 제거
    elementTable.clear();

    dcmFileFormat = ref.alloc(DcmFileFormatPtrPtr);
    if(!nodeDCMTK.OpenDcmFileFormat(fileName, dcmFileFormat))
        console.error('OpenDcmFileFormat failed!');

    var elementCount = ref.alloc('long');
    nodeDCMTK.GetElementCount(dcmFileFormat.deref(), elementCount);
    console.log('GetElementCount Success=' + elementCount.deref());
    
    for(var i=0; i<elementCount.deref(); i++)
    {
        var dcmElementPtr = ref.alloc(DcmElementPtrPtr);
        nodeDCMTK.GetElement(dcmFileFormat.deref(), i, dcmElementPtr);
        AddTableRow(dcmElementPtr.deref());
    }
};

function IsItemTag(dcmElementPtr){
    var gtag = ref.alloc('uint16');
    nodeDCMTK.GetElementGTag(dcmElementPtr, gtag);

    var etag = ref.alloc('uint16');
    nodeDCMTK.GetElementETag(dcmElementPtr, etag);

    if(gtag.deref() == 0xFFFE && etag.deref() == 0xE000)
        return true;

    return false;
}

function GetRowId(row){
    return row.id();
}

function SetRowId(row, id){
    return row.nodes().to$().attr("parentid", id);
}

function AddTableRow(dcmElementPtr, level, parentRow, id, isLeaf){
    ///insert to dictionary
    ID2Elements[id] = dcmElementPtr;

    var gtag = ref.alloc('uint16');
    nodeDCMTK.GetElementGTag(dcmElementPtr, gtag);

    var etag = ref.alloc('uint16');
    nodeDCMTK.GetElementETag(dcmElementPtr, etag);

    var elementName = new Buffer(255);
    nodeDCMTK.GetElementTagName(dcmElementPtr, elementName);

    var vr = new Buffer(255);
    nodeDCMTK.GetElementVR(dcmElementPtr, vr);

    var value = new Buffer(255);
    nodeDCMTK.GetElementStringValue(dcmElementPtr, value);

    var isLeaf = ref.alloc('uchar');
    nodeDCMTK.IsLeafElement(dcmElementPtr, isLeaf);

    var elementTag = '[{0}:{1}]'.format(util.toHex(gtag.deref(),4), util.toHex(etag.deref(),4));
    if(parentRow != null)
    {
        var row = parentRow.table().row.add({
            'id': id,
            'tag': elementTag,
            'name': elementName,
            'vr': vr,
            'value': value,
        }).draw(false);

        ///Add explicitly
        SetRowId(row, GetRowId(parentRow));
        addClass(row, 'childitem');
        row.nodes().to$().hide();
    }
    else
    {
        var row = elementTable.row.add({
            'id': id,
            'tag': elementTag,
            'name': elementName,
            'vr': vr,
            'value': value,
        }).draw(false);
    }
    return row;
}

function ShowEditForm(row){
    var rowData = row.data();
    var id = rowData['id'];
    var tag = util.trim(rowData['tag'].toString('utf8'));
    var name = util.trim(rowData['name'].toString('utf8'));
    var vr = util.trim(rowData['vr'].toString('utf8'));
    var value = util.trim(rowData['value'].toString('utf8'));

    vex.defaultOptions.className = 'vex-theme-top';
    vex.dialog.open({
        message: 'Modify Element Value',
        input: [
            '<label for="tag">TAG</label><input name="tag" type="text" value="{0}" readonly/>'.format(tag),
            '<label for="name">Name</label><input name="name" type="text" value="{0}" readonly/>'.format(name),
            '<label for="vr">VR</label><input name="vr" type="text" value="{0}" readonly />'.format(vr),
            '<label for="value">Value</label><input name="value" type="text" value="{0}" autofocus />'.format(value)
        ].join(''),
        buttons: [
            $.extend({}, vex.dialog.buttons.YES, { text: 'OK' }),
            $.extend({}, vex.dialog.buttons.NO, { text: 'Cancel' })
        ],
        callback: function (data) {
            if (!data) 
                return;
                
            ///modify
            rowData['value'] = data.value.trim();
            nodeDCMTK.SetElementValue(ID2Elements[id], rowData['value']);
            row.invalidate().draw();
        }
    });
}

export { 
    DcmFileFormatPtrPtr,
    DcmElementPtrPtr,
    nodeDCMTK,
    loadDICOMFile,
    closeDICOMFile,
    saveDICOMFile,
    loadDICOMFileHierarchy,
    SetOpenClosed,
    IsRowOpend,
    IsRowClosed,
    GetRowId,
    ShowEditForm,
    vex
};

