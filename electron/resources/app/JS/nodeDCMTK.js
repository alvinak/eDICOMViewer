var util = require('./util.js');

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

var longPtr = ref.refType('long');
var ushortPtr = ref.refType('uint16');
var boolPtr = ref.refType('bool');

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
'IsLeafElement': ['int',[DcmElementPtr,boolPtr]]
});

process.env['PATH'] = oldPath;


function loadDICOMFile(fileName){
    var dcmFileFormat = ref.alloc(DcmFileFormatPtrPtr);
    if(!nodeDCMTK.OpenDcmFileFormat(fileName, dcmFileFormat))
        console.error("OpenDcmFileFormat failed!");

    var elementCount = ref.alloc('long');
    nodeDCMTK.GetElementCount(dcmFileFormat.deref(), elementCount);
    console.log("GetElementCount Success=" + elementCount.deref());
    
    ///TODO:delete  items in elementTable

    for(var i=0; i<elementCount.deref(); i++)
    {
        var dcmElementPtr = ref.alloc(DcmElementPtrPtr);
        nodeDCMTK.GetElement(dcmFileFormat.deref(), i, dcmElementPtr);

        var gtag = ref.alloc('uint16');
        nodeDCMTK.GetElementGTag(dcmElementPtr.deref(), gtag);

        var etag = ref.alloc('uint16');
        nodeDCMTK.GetElementETag(dcmElementPtr.deref(), etag);

        var elementName = new Buffer(255);
        nodeDCMTK.GetElementTagName(dcmElementPtr.deref(), elementName);

        var vr = new Buffer(255);
        nodeDCMTK.GetElementVR(dcmElementPtr.deref(), vr);

        var value = new Buffer(255);
        nodeDCMTK.GetElementStringValue(dcmElementPtr.deref(), value);

        var isLeaf = ref.alloc('bool');
        nodeDCMTK.IsLeafElement(dcmElementPtr.deref(), isLeaf);

        var elementText = "[{0}:{1}]".format(util.toHex(gtag.deref(),4), util.toHex(etag.deref(),4));
        if(isLeaf)
            elementText = ">"+ elementText;
        elementTable.row.add([
            elementText,
            elementName.toString('utf8'),
            vr.toString('utf8'),
            value.toString('utf8'),
        ]).draw(false);
    }

    nodeDCMTK.CloseDcmFileFormat(dcmFileFormat.deref());
};

export { 
    DcmFileFormatPtrPtr,
    DcmElementPtrPtr,
    nodeDCMTK,
    loadDICOMFile 
};

