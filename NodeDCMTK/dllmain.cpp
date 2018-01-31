// dllmain.cpp: DLL 응용 프로그램의 진입점을 정의합니다.
#include "stdafx.h"
#include "NodeDCMTK.h"
#include "dcmtk/dcmdata/dcfilefo.h"
#include "dcmtk/dcmdata/dctagkey.h"
#include "dcmtk/config/osconfig.h"
#include "dcmtk/dcmdata/dctk.h"

#define MAX_STRINGBUFFER_SIZE	1024

char g_string_buffer[MAX_STRINGBUFFER_SIZE] = { 0, };

BOOL APIENTRY DllMain( HMODULE hModule,
                       DWORD  ul_reason_for_call,
                       LPVOID lpReserved
                     )
{
    switch (ul_reason_for_call)
    {
    case DLL_PROCESS_ATTACH:
    case DLL_THREAD_ATTACH:
    case DLL_THREAD_DETACH:
    case DLL_PROCESS_DETACH:
        break;
    }
    return TRUE;
}

int test_sum(int a, int b)
{
	return a + b;
}

void test_parameter_string(char* param)
{
	char buffer[256];
	sprintf(buffer, "test_parameter_string::param=%s", param);
	OutputDebugStringA(buffer);
}

char* test_return_string(double data)
{
	sprintf(g_string_buffer, "convert::%f", data);
	return g_string_buffer;
}

void test_loaddcm()
{
	DcmFileFormat dcmfileFormat;
	OFCondition status = dcmfileFormat.loadFile("..\\etc\\sampleDICOM\\0001.DCM");
	if (!status.good())
		return;

	for (long i = 0; i < dcmfileFormat.getDataset()->card(); i++)
	{
		DcmElement* pElement = dcmfileFormat.getDataset()->getElement(i);
		if (pElement == NULL)
			continue;

		OFString value;
		status = pElement->getOFString(value, 0);
		if (!status.good())
			continue;

		char buffer[256];
		sprintf(buffer, "[%04X:%04X] %s : %s", pElement->getGTag(), pElement->getETag(), ((DcmTag&)pElement->getTag()).getTagName(), value);
		OutputDebugStringA(buffer);
	}
}
