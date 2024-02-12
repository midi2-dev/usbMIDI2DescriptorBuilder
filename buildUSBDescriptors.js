
function buildTinyUSBDescriptors(config){
    const TUSB_DESC_INTERFACE_ASSOCIATION = 0x0B;
    const TUSB_CLASS_CDC = 0x02;
    const CDC_COMM_SUBCLASS_ABSTRACT_CONTROL_MODEL = 0x02;
    const CDC_COMM_PROTOCOL_NONE = 0x00;
    const TUSB_DESC_CS_INTERFACE = 0x24;
    const TUSB_DESC_ENDPOINT = 0x05;
    const CDC_FUNC_DESC_HEADER = 0x00;
    const CDC_FUNC_DESC_CALL_MANAGEMENT = 0x01;
    const CDC_FUNC_DESC_ABSTRACT_CONTROL_MANAGEMENT = 0x02;
    const CDC_FUNC_DESC_UNION = 0x06;
    const TUSB_XFER_INTERRUPT = 0x03;
    const TUSB_XFER_BULK = 0x02;
    const TUSB_DESC_INTERFACE = 0x04;
    const TUSB_CLASS_CDC_DATA =10;

    const  EPNUM_CDC_NOTIF  = 0x81;
    const  EPNUM_CDC_OUT    = 0x02;
    const  EPNUM_CDC_IN     = 0x82;
    const  EPNUM_MIDI      =  0x03;

    const MIDI_CS_INTERFACE_HEADER    = 0x01;
    const MIDI_CS_INTERFACE_IN_JACK   = 0x02;
    const MIDI_CS_INTERFACE_OUT_JACK  = 0x03;
    const MIDI_CS_INTERFACE_ELEMENT   = 0x04;
    const MIDI_CS_INTERFACE_GR_TRM_BLOCK = 0x26;
    const MIDI_GR_TRM_BLOCK_HEADER = 0x01;
    const MIDI_GR_TRM_BLOCK = 0x02;

    let stringIdx = [""];

    function U16_TO_U8S_LE(v,m=""){
        return [
            {v:v & 0xFF, m:`${m}LSB`},
            {v:(v>>8) & 0xFF, m:`${m}MSB`}
        ];
    }

    function arrayToHex(arrHex, joinStr = ' '){
        //const arrHex = Array.from(arrHex);
        if(!arrHex)return '';
        return arrHex.map(function(v){return v===undefined?'??':"0x"+("00" + v.toString(16)).slice (-2).toUpperCase();}).join(joinStr);

    }

    function addString(string){
        let idx = stringIdx.indexOf(string);
        if(idx=== -1){
            stringIdx.push(string);
            return stringIdx.length - 1;
        }
        return idx;
    }

    let  ITF_NUM_TOTAL = config.endpoints.length * 2;
    let ITF_NUM_CDC = 0;
    let ITF_NUM_MIDI = 0;
    if(config.CDC){
        ITF_NUM_TOTAL+=2;
        ITF_NUM_MIDI+=2
    }

    let idVendor = parseInt(config.idVendor,16);
    //idVendor = ((idVendor << 8) & 0xFF00) + ((idVendor >> 8) & 0xFF); //Swap bytes
    let idProduct = parseInt(config.idProduct,16);
    //idProduct = ((idProduct << 8) & 0xFF00) + ((idProduct >> 8) & 0xFF); //Swap bytes
    let devDevice = [
        {v:18, m: "bLength"},
        {v:0x01, m: "bDescriptorType = TUSB_DESC_DEVICE"},
        ...U16_TO_U8S_LE(0x02,'bcdUSB'),
        {v:0xEF, m: "bDeviceClass = TUSB_CLASS_MISC"},
        {v:0x02, m: "bDeviceSubClass = TUSB_CLASS_MISC"},
        {v:0x01, m: "bDeviceProtocol = MISC_PROTOCOL_IAD"},
        {v:0x40, m: "bMaxPacketSize0"},
        ...U16_TO_U8S_LE(idVendor,'idVendor'),
        ...U16_TO_U8S_LE(idProduct,'idProduct'),
        ...U16_TO_U8S_LE(0x4000,'bcdDevice'),
        {v:addString(config.manufacturer), m: "iManufacturer"},
        {v:addString(config.product), m: "iProduct"},
        {v:addString(config.serialNumber), m: "iSerialNumber"},
        {v:0x01, m: "bNumConfigurations"},
    ];

    let devQualifier = [
        {v:10, m: "bLength"},
        {v:0x06, m: "bDescriptorType = TUSB_DESC_DEVICE_QUALIFIER"},
        ...U16_TO_U8S_LE(0x02,'bcdUSB'),
        {v:0xEF, m: "bDeviceClass = TUSB_CLASS_MISC"},
        {v:0x02, m: "bDeviceSubClass = TUSB_CLASS_MISC"},
        {v:0x01, m: "bDeviceProtocol = MISC_PROTOCOL_IAD"},
        {v:0x40, m: "bMaxPacketSize0"},
        {v:0x01, m: "bNumConfigurations"},
        {v:0x00, m: "bReserved"},
    ];



    let descriptor = [
        {v:0x09, m: "bLength"},
        {v:0x02, m: "bDescriptorType = CONFIGURATION"},
        {v:0x00, m: "wTotalLengthLSB"}, //These are Replaced Later below
        {v:0x00, m: "wTotalLengthMSB"},
        {v:(config.endpoints.length*2) + (config.CDC?2:0), m: "bNumInterfaces"},
        {v:0x01, m: "bConfigurationValue"},
        {v:0x00, m: "iConfiguration"},
        {v:0x80, m: "bmAttributes"},
        {v:config.power/2, m: `bMaxPower (${config.power}mA)`}
    ];

    if(config.CDC){
        descriptor.push(...[
            {m:"---------------------------"},
            {m:"Interface Associate"},
            {v:8},
            {v:TUSB_DESC_INTERFACE_ASSOCIATION,m:"TUSB_DESC_INTERFACE_ASSOCIATION"},
            {v:ITF_NUM_CDC,m:"ITF_NUM_CDC"},
            {v:2},
            {v:TUSB_CLASS_CDC,m:"TUSB_CLASS_CDC"},
            {v:CDC_COMM_SUBCLASS_ABSTRACT_CONTROL_MODEL,m:"CDC_COMM_SUBCLASS_ABSTRACT_CONTROL_MODEL"},
            {v:CDC_COMM_PROTOCOL_NONE,m:"CDC_COMM_PROTOCOL_NONE"},
            {v:0},
            {m:"CDC Control Interface"},
            {v:9},
            {v:0x04, m:"TUSB_DESC_INTERFACE"},
            {v:ITF_NUM_CDC,m:"Interface number"},
            {v:0},
            {v:1},
            {v:TUSB_CLASS_CDC,m:"TUSB_CLASS_CDC"},
            {v:CDC_COMM_SUBCLASS_ABSTRACT_CONTROL_MODEL,m:"CDC_COMM_SUBCLASS_ABSTRACT_CONTROL_MODEL"},
            {v:CDC_COMM_PROTOCOL_NONE,m:"CDC_COMM_PROTOCOL_NONE"},
            {v:addString(config.CDCName),m:"String Index"},
            {m:"CDC Header"},
            {v:5},
            {v:TUSB_DESC_CS_INTERFACE,m:"TUSB_DESC_CS_INTERFACE"},
            {v:CDC_FUNC_DESC_HEADER,m:"CDC_FUNC_DESC_HEADER"},
            ...U16_TO_U8S_LE(0x0120,""),
            {m:"CDC Call"},
            {v:5},
            {v:TUSB_DESC_CS_INTERFACE,m:"TUSB_DESC_CS_INTERFACE"},
            {v:CDC_FUNC_DESC_CALL_MANAGEMENT,m:"CDC_FUNC_DESC_CALL_MANAGEMENT"},
            {v:0},
            {v:(ITF_NUM_CDC + 1),m:"Interface Number"},
            {m:"CDC ACM: support line request"},
            {v:4},
            {v:TUSB_DESC_CS_INTERFACE,m:"TUSB_DESC_CS_INTERFACE"},
            {v:CDC_FUNC_DESC_ABSTRACT_CONTROL_MANAGEMENT,m:"CDC_FUNC_DESC_ABSTRACT_CONTROL_MANAGEMENT"},
            {v:2},
            {m:"CDC Union"},
            {v:5},
            {v:TUSB_DESC_CS_INTERFACE,m:"TUSB_DESC_CS_INTERFACE"},
            {v:CDC_FUNC_DESC_UNION,m:"CDC_FUNC_DESC_UNION"},
            {v:ITF_NUM_CDC,m:"ITF_NUM_CDC"},
            {v:(ITF_NUM_CDC + 1),m:"ITF_NUM_CDC + 1"},
            {m:"Endpoint Notification"},
            {v:7},
            {v:TUSB_DESC_ENDPOINT,m:"TUSB_DESC_ENDPOINT"},
            {v:EPNUM_CDC_NOTIF,m:"EPNUM_CDC_NOTIF"},
            {v:TUSB_XFER_INTERRUPT,m:"TUSB_XFER_INTERRUPT"},
            ...U16_TO_U8S_LE(8,"_ep_notif_size"), //_ep_notif_size
            {v:16},
            {m:"CDC Data Interface"},
            {v:9},
            {v: TUSB_DESC_INTERFACE,m:"TUSB_DESC_INTERFACE"},
            {v:(ITF_NUM_CDC+1),m:"Interface Number"},
            {v:0},
            {v:2},
            {v:TUSB_CLASS_CDC_DATA,m:"TUSB_CLASS_CDC_DATA"},
            {v:0},
            {v:0},
            {v:0},
            {m:"Endpoint Out"},
            {v:7},
            {v:TUSB_DESC_ENDPOINT,m:"TUSB_DESC_ENDPOINT"},
            {v:EPNUM_CDC_OUT,m:"EPNUM_CDC_OUT"},
            {v:TUSB_XFER_BULK,m:"TUSB_XFER_BULK"},
            ...U16_TO_U8S_LE(64,"epSize"), //_epsize
            {v:0},
            {m:"Endpoint In"},
            {v:7},
            {v:TUSB_DESC_ENDPOINT,m:"TUSB_DESC_ENDPOINT"},
            {v:EPNUM_CDC_IN,m:"EPNUM_CDC_IN"},
            {v:TUSB_XFER_BULK,m:"TUSB_XFER_BULK"},
            ...U16_TO_U8S_LE(64,"epSize"), //_epsize
            {v:0}
        ]);
    }


    config.endpoints.map((ep, epIdx)=>{
        let gtbInId=[];
        let gtbOutId=[];

        ep.blocks = ep.blocks || [];

        ep.gtbDescriptor = [
            {v:5,m:"HeaderLength"},
            {v:MIDI_CS_INTERFACE_GR_TRM_BLOCK,m:"bDescriptorType = CS_GR_TRM_BLOCK"},
            {v:MIDI_GR_TRM_BLOCK_HEADER,m:"bDescriptorSubtype = GR_TRM_BLOCK_HEADER"},
            ...U16_TO_U8S_LE((13 * ep.blocks.length) + 5,"wTotalLength")
        ];

        ep.blocks.map((gtb, idx)=>{
            if(gtb.in){gtbInId.push({v:idx+1,m:"baAssoGrpTrmBlkID"})};
            if(gtb.out){gtbOutId.push({v:idx+1,m:"baAssoGrpTrmBlkID"})};
            //gtbDescriptor

            let protocol = gtb.protocol || ep.defaultGTBProtocol || 0;
            ep.gtbDescriptor.push(
                {v:13,m:"bLength"},
                {v:MIDI_CS_INTERFACE_GR_TRM_BLOCK,m:"bDescriptorType = CS_GR_TRM_BLOCK"},
                {v:MIDI_GR_TRM_BLOCK,m:"bDescriptorSubtype = GR_TRM_BLOCK"},
                {v:idx+1,m:"bGrpTrmBlkID"},
                {v: gtb.in && gtb.out? 0x00: gtb.out?0x02: 0x01,m:"bGrpTrmBlkType = "+gtb.in && gtb.out? "birectional": gtb.out?"out": "in"},
                {v:gtb.firstGroup -1,m:"First Group"},
                {v:gtb.numOfGroups,m:"nNumGroupTrm"},
                {v:addString(gtb.name),m:"iBlockItem"},
                {v:protocol===2?0x11:protocol===1?0x02:0,m:"bMIDIProtocol"},
                ...U16_TO_U8S_LE(gtb.wMaxInputBandwidth || 0,"wMaxInputBandwidth"),
                ...U16_TO_U8S_LE(gtb.wMaxOutputBandwidth || 0,"wMaxOutputBandwidth")
            );
        });


        let m1TotalLen =
            7 // Audio MS Descriptor - CS Interface
            +(ep.MIDI1Itf.filter(m1=>m1.in).length * 16)
            + (ep.MIDI1Itf.filter(m1=>m1.out).length * 16)
            +9 // ----- EP Descriptor - Endpoint - MIDI OUT
            +4 // ----- Audio MS Descriptor - CS Endpoint - EP General
            +9 // ----- EP Descriptor - Endpoint - MIDI IN
            +4; // ----- Audio MS Descriptor - CS Endpoint - EP General

        descriptor.push(...[
            {m:"---------------------------"},
            {m:"Interface Association Descriptor"},
            {v:0x08,m:"bLength"},
            {v:0x0B,m:"bDescriptorType"},
            {v:ITF_NUM_MIDI,m:"bFirstInterface"},
            {v:0x02,m:"bInterfaceCount"},
            {v:0x01,m:"bFunctionClass"},
            {v:0x03,m:"bFunctionSubClass"},
            {v:0x00,m:"bFunctionProtocol"},
            {v:0x00,m:"iFunction"},

            {m:"Interface - Audio Control"},
            {v:0x09,m:"bLength"},
            {v:0x04,m:"bDescriptorType = INTERFACE"},
            {v:ITF_NUM_MIDI,m:"bInterfaceNumber"},
            {v:0x00,m:"bAlternateSetting"},
            {v:0x00,m:"bNumEndpoints"},
            {v:0x01,m:"bInterfaceClass = AUDIO"},
            {v:0x01,m:"bInterfaceSubClass = AUDIO_CONTRO"},
            {v:0x00,m:"bInterfaceProtocol"},
            {v:0x00,m:"iInterface"},

            {m:"Audio AC Descriptor - Header"},
            {v:0x09,m:"bLength"},
            {v:0x24,m:"bDescriptorType = CS_INTERFACE"},
            {v:0x01,m:"bDescriptorSubtype = HEADER"},
            {v:0x00,m:"bcdACD0"},
            {v:0x01,m:"bcdACD1"},
            {v:0x09,m:"wTotalLengthLSB"},
            {v:0x00,m:"wTotalLengthMSB"},
            {v:0x01,m:"bInCollection"},
            {v:ITF_NUM_MIDI+1,m:"baInterfaceNr(1)"},

            {m:"Interface - MIDIStreaming - Alternate Setting #0"},
            {v:0x09,m:"bLength"},
            {v:0x04,m:"bDescriptorType = INTERFACE"},
            {v:ITF_NUM_MIDI+1,m:"bInterfaceNumber"},
            {v:0x00,m:"bAlternateSetting"},
            {v:0x02,m:"bNumEndpoints"},
            {v:0x01,m:"bInterfaceClass = AUDIO"},
            {v:0x03,m:"bInterfaceSubClass = MIDISTREAMING"},
            {v:0x00,m:"bInterfaceProtocol"},
            {v:addString(ep.name),m:"iInterface"}, //Unused according to docs? but some Hosts use it?

            {m:"Audio MS Descriptor - CS Interface - MS Header"},
            {v:0x07,m:"bLength"},
            {v:0x24,m:"bDescriptorType = CS_INTERFACE"},
            {v:0x01,m:"bDescriptorSubtype = MS_HEADER"},
            {v:0x00,m:"bcdMSCLSB"},
            {v:0x01,m:"bcdMSCMSB"},
            ...U16_TO_U8S_LE(m1TotalLen,"wTotalLength")
            // 0x5D,                   // ( 93) wTotalLengthLSB ????? Total size of class-specific descriptors.
            // 0x00,                   // (  0) wTotalLengthMSB
        ]);

        let midiInJackId=[];
        let midiOutJackId=[];
        ep.MIDI1Itf.map((m1,idx)=>{
            if(m1.in){
                midiInJackId.push({v:(idx*4) + 1 + (epIdx*16),m:"jack Id"});
                descriptor.push(...[
                    {m:"Audio MS Descriptor - CS Interface - MIDI IN Jack (EXT) (Embedded)"},
                    {v:0x06,m:"bLength"},
                    {v:0x24,m:"bDescriptorType = CS_INTERFACE"},
                    {v:0x02,m:"bDescriptorSubtype = MIDI_IN_JACK"},
                    {v:0x01,m:"bJackType = EMBEDDED."},
                    {v: (idx*4) + 1 + (epIdx*16),m:"bJackID"},
                    {v:addString(m1.name),m:"iJack"},

                    {m:"Audio MS Descriptor - CS Interface - MIDI OUT Jack (EXT) (Main Out)"},
                    {v:0x09,m:"bLength"},
                    {v:0x24,m:"bDescriptorType = CS_INTERFACE"},
                    {v:0x03,m:"bDescriptorSubtype = MIDI_OUT_JACK"},
                    {v:0x02,m:"bJackType = EXTERNAL."},
                    {v:(idx*4) + 16 + 1 + (epIdx*16),m:"bJackID"},
                    {v:0x01,m:"bNrInputPins"},
                    {v:(idx*4) + 1 + (epIdx*16),m:"baSourceID"},
                    {v:0x01,m:"baSourcePin"},
                    {v:addString(m1.name),m:"iJack"},
                ]);
            }

            if(m1.out){
                midiOutJackId.push({v:(idx*4) + 16  + 2 + (epIdx*16),m:"Jack Id"});
                descriptor.push(...[
                    {m:"Audio MS Descriptor - CS Interface - MIDI IN Jack (EXT) (Main In)"},
                    {v:0x06,m:"bLength"},
                    {v:0x24,m:"bDescriptorType = CS_INTERFACE"},
                    {v:0x02,m:"bDescriptorSubtype = MIDI_IN_JACK"},
                    {v:0x02,m:"bJackType = EXTERNAL"},
                    {v:(idx*4) + 2  + (epIdx*16),m:"bJackID"},
                    {v:addString(m1.name),m:"iJack"},

                    {m:"Audio MS Descriptor - CS Interface - MIDI OUT Jack (EMB) (Main Out)"},
                    {v:0x09,m:"bLength"},
                    {v:0x24,m:"bDescriptorType"},
                    {v:0x03,m:"bDescriptorSubtype"},
                    {v:0x01,m:"bJackType"},
                    {v:(idx*4) + 16 +2 + (epIdx*16),m:"bJackID"},
                    {v:0x01,m:"Number of Input Pins of this Jack"},
                    {v:(idx*4) + 2  + (epIdx*16),m:"baSourceID"},
                    {v:0x01,m:"baSourcePin"},
                    {v:addString(m1.name),m:"iJack"},
                ]);
            }



        });

        if(midiOutJackId.length){
            descriptor.push(...[
                {m:"EP Descriptor - Endpoint - MIDI OUT"},
                {v:0x09,m:"bLength"},
                {v:0x05,m:"bDescriptorType = ENDPOINT"},
                {v:(epIdx) + EPNUM_MIDI,m:"bEndpointAddress (OUT)"},
                {v:0x02,m:"bmAttributes"},
                {v:0x40,m:"wMaxPacketSizeLSB"},
                {v:0x00,m:"wMaxPacketSizeMSB"},
                {v:0x00,m:"bInterval"},
                {v:0x00,m:"bRefresh"},
                {v:0x00,m:"bSynchAddress"},

                {m:"Audio MS Descriptor - CS Endpoint - EP General"},
                {v:0x04 + midiOutJackId.length,m:"bLength"},
                {v:0x25,m:"bDescriptorType = CS_ENDPOINT"},
                {v:0x01,m:"bDescriptorSubtype = MS_GENERAL"},
                {v:midiOutJackId.length,m:"bNumEmbMIDJack"},
                ...midiOutJackId
            ]);
        }

        if(midiInJackId.length){
            descriptor.push(...[
                {m:"EP Descriptor - Endpoint - MIDI IN"},
                {v:0x09,m:"bLength"},
                {v:0x05,m:"bDescriptorType = ENDPOINT"},
                {v:0x80+ (epIdx) +EPNUM_MIDI,m:"bEndpointAddress (IN)"},
                {v:0x02,m:"bmAttributes"},
                {v:0x40,m:"wMaxPacketSizeLSB"},
                {v:0x00,m:"wMaxPacketSizeMSB"},
                {v:0x00,m:"bInterval"},
                {v:0x00,m:"bRefresh"},
                {v:0x00,m:"bSynchAddress"},

                {m:"Audio MS Descriptor - CS Endpoint - MS General"},
                {v:0x04 + midiInJackId.length,m:"bLength"},
                {v:0x25,m:"bDescriptorType = CS_ENDPOINT"},
                {v:0x01,m:"bDescriptorSubtype = MS_GENERAL"},
                {v:midiInJackId.length,m:"bNumEmbMIDJack"},
                ...midiInJackId
            ]);
        }


//MIDI 2.0 Settings below
        if(ep.blocks.length) {
            ep.interfaceId = ITF_NUM_MIDI + 1;

            descriptor.push(...[
                {m: "Interface - MIDIStreaming - Alternate Setting #1"},
                {v: 0x09, m: "bLength"},
                {v: 0x04, m: "bDescriptorType = INTERFACE"},
                {v: ITF_NUM_MIDI + 1, m: "bInterfaceNumber"},
                {v: 0x01, m: "bAlternateSetting"},
                {v: 0x02, m: "bNumEndpoints"},
                {v: 0x01, m: "bInterfaceClass = AUDIO"},
                {v: 0x03, m: "bInterfaceSubClass = MIDISTREAMING"},
                {v: 0x00, m: " bInterfaceProtocol"},
                {v: addString(ep.name), m: "iInterface"}, //Unused??

                {m: "Audio MS Descriptor - CS Interface - MS Header"},
                {v: 0x07, m: "bLength"},
                {v: 0x24, m: "bDescriptorType = CS_INTERFACE"},
                {v: 0x01, m: "bDescriptorSubtype = MS_HEADER"},
                {v: 0x00, m: "bcdMSC_LSB"},
                {v: 0x02, m: "bcdMSC_MSB"},
                {v: 0x07, m: "wTotalLengthLSB"},
                {v: 0x00, m: "wTotalLengthMSB"},

                {m: "EP Descriptor - Endpoint - MIDI OUT"},
                {v: 0x07, m: "bLength"},
                {v: 0x05, m: "bDescriptorType = ENDPOINT"},
                {v: (epIdx) + EPNUM_MIDI, m: "bEndpointAddress (OUT)"},
                {v: 0x02, m: "bmAttributes"},
                {v: 0x40, m: "wMaxPacketSizeLSB"},
                {v: 0x00, m: "wMaxPacketSizeMSB"},
                {v: 0x00, m: "bInterval"},

                {m: "Audio MS Descriptor - CS Endpoint - MS General 2.0"},
                {v: 0x04 + gtbInId.length, m: "bLength"},
                {v: 0x25, m: "bDescriptorType = CS_ENDPOINT"},
                {v: 0x02, m: "bDescriptorSubtype = MS_GENERAL_2_0"},
                {v: gtbInId.length, m: "bNumGrpTrmBlock"},
                ...gtbInId,             // (  2) baAssoGrpTrmBlkID


                {m: "EP Descriptor - Endpoint - MIDI IN"},
                {v: 0x07, m: "bLength"},
                {v: 0x05, m: "bDescriptorType = ENDPOINT"},
                {v: 0x80 + (epIdx) + EPNUM_MIDI, m: "bEndpointAddress (IN)"},
                {v: 0x02, m: "bmAttributes"},
                {v: 0x40, m: "wMaxPacketSizeLSB"},
                {v: 0x00, m: "wMaxPacketSizeMSB"},
                {v: 0x00, m: "bInterval"},

                {m: "Audio MS Descriptor - CS Endpoint - MS General 2.0"},
                {v: 0x04 + gtbOutId.length, m: "bLength"},
                {v: 0x25, m: "bDescriptorType = CS_ENDPOINT"},
                {v: 0x02, m: "bDescriptorSubtype = MS_GENERAL_2_0"},
                {v: gtbOutId.length, m: "bNumGrpTrmBlock"},
                ...gtbOutId                   // (  3) baAssoGrpTrmBlkID
            ]);

        }

        ITF_NUM_MIDI += 2;
    });

    config.prefix = config.prefix || "";


    const TotalLength = U16_TO_U8S_LE(descriptor.filter(d=>d.v!==undefined).length,"Total Length");

    descriptor[2] = TotalLength[0];
    descriptor[3] = TotalLength[1];

    let out = [];

    out.push(`uint8_t const ${config.prefix}desc_device[] = {`)
    out.push(outStr(devDevice));
    out.push("};\n") ;

    out.push(`uint8_t const ${config.prefix}desc_device_qualifier[] = {`)
    out.push(outStr(devQualifier));
    out.push("};\n") ;

    out.push(`uint8_t const ${config.prefix}desc_fs_configuration[] = {`)
    out.push(outStr(descriptor));
    out.push("};");

    let gtbarray= [];
    config.endpoints.map((ep,idx)=>{
        gtbarray.push(`gtb${idx}`);
        out.push(`uint8_t const ${config.prefix}gtb${idx}[] = {`)
        if(ep.blocks?.length)out.push(outStr(ep.gtbDescriptor));
        out.push("};")
    });
    out.push(`uint8_t const ${config.prefix}gtbLengths[] = {${config.endpoints.map(e=>e.gtbDescriptor.length).join(',')}};`)


    out.push(`uint8_t const ${config.prefix}epInterface[] = {${config.endpoints.map(e=>e.interfaceId).join(',')}};`)


    out.push(`uint8_t const *${config.prefix}group_descr[] = {${gtbarray.join(',')}};`)

    out.push(`char const* ${config.prefix}string_desc_arr [] = {`)
    stringIdx.map((name,idx)=>{
        out.push(`\t"${name}"${idx===stringIdx.length?'':','} //${idx}`)
    });
    //out.push(`"${stringIdx.join('", "')}"`)
    out.push("};")

    out.push(`uint8_t const ${config.prefix}string_desc_arr_length = ${stringIdx.length};`)

    return out.join("\n");

}


function outStr(arr){

    return arr.map((d,idx)=>{
        let str ="\t";
        if(d.v!==undefined){
            str += "0x"+("00" + d.v.toString(16)).slice (-2).toUpperCase() + (arr.length-1!==idx?",\t":"\t");
        }else if(arr.length-1!==idx){
            str += "\n  "
        }
        if(d.m){
            str+="// "+d.m
        }
        return str + (arr.length-1!==idx?"\n":"");
    }).join('')

}




