
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

    function U16_TO_U8S_LE(v){
        return [v & 0xFF, (v>>8) & 0xFF];
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

    addString(config.manufacturer);
    addString(config.product);
    addString(config.serialNumber);


    let descriptor = [
        0x09,                   // (  9) bLength
        0x02,                   // (  2) bDescriptorType
        0x00,                   //wTotalLengthLSB
        0x00,                   // (  0) wTotalLengthMSB
        (config.endpoints.length*2) + (config.CDC?2:0),          // (  4) bNumInterfaces
        0x01,                   // (  1) bConfigurationValue
        0x00,                   // (  0) iConfiguration
        0x80,                   // (128) bmAttributes
        config.power/2,                   // ( 50) bMaxPower (really??)
    ];

    if(config.CDC){
        //TUD_CDC_DESCRIPTOR(ITF_NUM_CDC, 4, EPNUM_CDC_NOTIF, 8, EPNUM_CDC_OUT, EPNUM_CDC_IN, 64),
        //TUD_CDC_DESCRIPTOR(_itfnum, _stridx, _ep_notif, _ep_notif_size, _epout, _epin, _epsize)

        descriptor.push(...[
            /* Interface Associate */
            8,
            TUSB_DESC_INTERFACE_ASSOCIATION,
            ITF_NUM_CDC,
            2,
            TUSB_CLASS_CDC,
            CDC_COMM_SUBCLASS_ABSTRACT_CONTROL_MODEL,
            CDC_COMM_PROTOCOL_NONE,
            0,
            /* CDC Control Interface */
            9,
            0x04, //TUSB_DESC_INTERFACE,
            ITF_NUM_CDC,
            0,
            1,
            TUSB_CLASS_CDC,
            CDC_COMM_SUBCLASS_ABSTRACT_CONTROL_MODEL,
            CDC_COMM_PROTOCOL_NONE,
            addString(config.CDCName),
            /* CDC Header */
            5,
            TUSB_DESC_CS_INTERFACE,
            CDC_FUNC_DESC_HEADER,
            ...U16_TO_U8S_LE(0x0120),
            /* CDC Call */
            5,
            TUSB_DESC_CS_INTERFACE,
            CDC_FUNC_DESC_CALL_MANAGEMENT,
            0,
            (ITF_NUM_CDC + 1),
            /* CDC ACM: support line request */
            4,
            TUSB_DESC_CS_INTERFACE,
            CDC_FUNC_DESC_ABSTRACT_CONTROL_MANAGEMENT,
            2,
            /* CDC Union */
            5,
            TUSB_DESC_CS_INTERFACE,
            CDC_FUNC_DESC_UNION,
            ITF_NUM_CDC,
            (ITF_NUM_CDC + 1),
            /* Endpoint Notification */
            7,
            TUSB_DESC_ENDPOINT,
            EPNUM_CDC_NOTIF,
            TUSB_XFER_INTERRUPT,
            ...U16_TO_U8S_LE(8), //_ep_notif_size
            16,
            /* CDC Data Interface */
            9,
            TUSB_DESC_INTERFACE,
            (ITF_NUM_CDC+1),
            0,
            2,
            TUSB_CLASS_CDC_DATA,
            0,
            0,
            0,
            /* Endpoint Out */
            7, TUSB_DESC_ENDPOINT,
            EPNUM_CDC_OUT,
            TUSB_XFER_BULK,
            ...U16_TO_U8S_LE(64), //_epsize
            0,
            /* Endpoint In */
            7,
            TUSB_DESC_ENDPOINT,
            EPNUM_CDC_IN,
            TUSB_XFER_BULK,
            ...U16_TO_U8S_LE(64), //_epsize
            0
        ]);
    }


    config.endpoints.map((ep, epIdx)=>{
        let gtbInId=[];
        let gtbOutId=[];

        ep.gtbDescriptor = [
            5, //HeaderLength
            MIDI_CS_INTERFACE_GR_TRM_BLOCK,
            MIDI_GR_TRM_BLOCK_HEADER,
            ...U16_TO_U8S_LE((13 * ep.blocks.length) + 5) ,
        ];

        ep.blocks.map((gtb, idx)=>{
            if(gtb.in){gtbInId.push(idx+1)};
            if(gtb.out){gtbOutId.push(idx+1)};
            //gtbDescriptor

            let protocol = gtb.protocol || ep.defaultGTBProtocol || 0;
            ep.gtbDescriptor.push(
                13, //length
                MIDI_CS_INTERFACE_GR_TRM_BLOCK,
                MIDI_GR_TRM_BLOCK,
                idx+1,
                gtb.in && gtb.out? 0x00: gtb.out?0x02: 0x01,
                gtb.firstGroup -1,
                gtb.numOfGroups,
                addString(gtb.name),
                protocol===2?0x11:protocol===1?0x02:0,
                ...U16_TO_U8S_LE(gtb.wMaxInputBandwidth || 0),
                ...U16_TO_U8S_LE(gtb.wMaxOutputBandwidth || 0)
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
            // ----- Interface Association Descriptor
            0x08,                   // (  8) bLength
            0x0B,                   // ( 11) bDescriptorType
            ITF_NUM_MIDI,           // (  2) bFirstInterface
            0x02,                   // (  2) bInterfaceCount
            0x01,                   // (  1) bFunctionClass
            0x03,                   // (  0) bFunctionSubClass
            0x00,                   // (  0) bFunctionProtocol
            0x00,                   // (  0) iFunction

            // ----- Interface - Audio Control
            0x09,                   // (  9) bLength
            0x04,                   // (  4) bDescriptorType
            ITF_NUM_MIDI,           // (  2) bInterfaceNumber
            0x00,                   // (  0) bAlternateSetting
            0x00,                   // (  0) bNumEndpoints
            0x01,                   // (  1) bInterfaceClass
            0x01,                   // (  1) bInterfaceSubClass
            0x00,                   // (  0) bInterfaceProtocol
            0x00,                   // (  0) iInterface

            // ----- Audio AC Descriptor - Header
            0x09,                   // (  9) bLength
            0x24,                   // ( 36) bDescriptorType
            0x01,                   // (  1) bDescriptorSubtype
            0x00,                   // (  0) bcdACD0
            0x01,                   // (  1) bcdACD1
            0x09,                   // (  9) wTotalLengthLSB
            0x00,                   // (  0) wTotalLengthMSB
            0x01,                   // (  1) Number of streaming interfaces
            ITF_NUM_MIDI+1,         // (  3) MIDIStreaming Interface

            // ----- Interface - MIDIStreaming
            0x09,                   // (  9) bLength
            0x04,                   // (  4) bDescriptorType
            ITF_NUM_MIDI+1,         // (  3) bInterfaceNumber
            0x00,                   // (  0) bAlternateSetting
            0x02,                   // (  2) bNumEndpoints
            0x01,                   // (  1) bInterfaceClass
            0x03,                   // (  3) bInterfaceSubClass
            0x00,                   // (  0) bInterfaceProtocol
            addString(ep.name)   ,                // (  5) iInterface - unused???

            // ----- Audio MS Descriptor - CS Interface - MS Header
            0x07,                   // (  7) bLength
            0x24,                   // ( 36) bDescriptorType
            0x01,                   // (  1) bDescriptorSubtype
            0x00,                   // (  0) bcdMSC_LSB
            0x01,                   // (  1) bcdMSC_MSB
            ...U16_TO_U8S_LE(m1TotalLen)
            // 0x5D,                   // ( 93) wTotalLengthLSB ????? Total size of class-specific descriptors.
            // 0x00,                   // (  0) wTotalLengthMSB
        ]);

        let midiInJackId=[];
        let midiOutJackId=[];
        ep.MIDI1Itf.map((m1,idx)=>{
            if(m1.in){
                midiInJackId.push((idx*4) + 1 + (epIdx*16));
                descriptor.push(...[
                    // ----- Audio MS Descriptor - CS Interface - MIDI IN Jack (EXT) (Embedded)
                    0x06,                   // (  6) bLength
                    0x24,                   // ( 36) bDescriptorType
                    0x02,                   // (  2) bDescriptorSubtype
                    0x01,                   // (  2) bJackType
                    (idx*4) + 1 + (epIdx*16),                   // (  2) bJackID
                    addString(m1.name),                // (  6) iJack

                    // ----- Audio MS Descriptor - CS Interface - MIDI OUT Jack (EXT) (Main Out)
                    0x09,                   // (  9) bLength
                    0x24,                   // ( 36) bDescriptorType
                    0x03,                   // (  3) bDescriptorSubtype
                    0x02,                   // (  2) bJackType External
                    (idx*4) + 16 + 1 + (epIdx*16),                // (  4) bJackID
                    0x01,                   // (  1) bNrInputPins
                    (idx*4) + 1 + (epIdx*16),                   // (  1) baSourceID
                    0x01,                   // (  1) baSourcePin
                    addString(m1.name),                   // (  6) iJack
                ]);
            }

            if(m1.out){
                midiOutJackId.push((idx*4) + 16  + 2 + (epIdx*16));
                descriptor.push(...[
                    // ----- Audio MS Descriptor - CS Interface - MIDI IN Jack (EXT) (Main In)
                    0x06,                   // (  6) bLength
                    0x24,                   // ( 36) bDescriptorType
                    0x02,                   // (  2) bDescriptorSubtype
                    0x02,                   // (  2) bJackType
                    (idx*4) + 2  + (epIdx*16),                   // (  2) bJackID
                    addString(m1.name),                // (  6) iJack

                    // ----- Audio MS Descriptor - CS Interface - MIDI IN Jack (EMB) (Main Out)
                    0x09,                   // (  6) bLength
                    0x24,                   // ( 36) bDescriptorType
                    0x03,                   // (  2) bDescriptorSubtype
                    0x01,                   // (  1) bJackType
                    (idx*4) + 16 +2 + (epIdx*16),                   // (  1) bJackID
                    0x01,                   //Number of Input Pins of this Jack
                    (idx*4) + 2  + (epIdx*16),                   // (  1) baSourceID
                    0x01,                   // (  1) baSourcePin
                    addString(m1.name),                   // (  6) iJack
                ]);
            }



        });

        if(midiOutJackId.length){
            descriptor.push(...[
                // ----- EP Descriptor - Endpoint - MIDI OUT
                0x09,                   // (  7) bLength
                0x05,                   // (  5) bDescriptorType
                (epIdx) + EPNUM_MIDI,             // (  1) bEndpointAddress
                0x02,                   // (  2) bmAttributes
                0x40,                   // (  0) wMaxPacketSizeLSB
                0x00,                   // (  2) wMaxPacketSizeMSB
                0x00,                   // (  0) bInterval
                0x00,                   // (  0) bRefresh
                0x00,                   // (  0) bSynchAddress

                // ----- Audio MS Descriptor - CS Endpoint - EP General
                0x04 + midiOutJackId.length,                   // (  6) bLength
                0x25,                   // ( 37) bDescriptorType
                0x01,                   // (  1) bDescriptorSubtype
                midiOutJackId.length,                   // (  2) bNumEmbMIDJack
                ...midiOutJackId
            ]);
        }

        if(midiInJackId.length){
            descriptor.push(...[
                // ----- EP Descriptor - Endpoint - MIDI IN
                0x09,                   // (  7) bLength
                0x05,                   // (  5) bDescriptorType
                0x80+ (epIdx) +EPNUM_MIDI,        // (129) bEndpointAddress
                0x02,                   // (  2) bmAttributes
                0x40,                   // (  0) wMaxPacketSizeLSB
                0x00,                   // (  2) wMaxPacketSizeMSB
                0x00,                   // (  0) bInterval
                0x00,                   // (  0) bRefresh
                0x00,                   // (  0) bSynchAddress

                // ----- Audio MS Descriptor - CS Endpoint - MS General
                0x04 + midiInJackId.length,                   // (  6) bLength
                0x25,                   // ( 37) bDescriptorType
                0x01,                   // (  1) bDescriptorSubtype
                midiInJackId.length,                   // (  2) bNumEmbMIDJack
                ...midiInJackId
            ]);
        }


//MIDI 2.0 Settings below

        ep.interfaceId = ITF_NUM_MIDI+1;

        descriptor.push(...[


            // ----- Interface - MIDIStreaming - Alternate Setting #1
            0x09,                   // (  9) bLength
            0x04,                   // (  4) bDescriptorType
            ITF_NUM_MIDI+1,         // (  1) bInterfaceNumber
            0x01,                   // (  1) bAlternateSetting
            0x02,                   // (  2) bNumEndpoints
            0x01,                   // (  1) bInterfaceClass
            0x03,                   // (  3) bInterfaceSubClass
            0x00,                   // (  0) bInterfaceProtocol
            addString(ep.name),                   // (  5) iInterface

            // ----- Audio MS Descriptor - CS Interface - MS Header
            0x07,                   // (  7) bLength
            0x24,                   // ( 36) bDescriptorType
            0x01,                   // (  1) bDescriptorSubtype
            0x00,                   // (  0) bcdMSC_LSB
            0x02,                   // (  2) bcdMSC_MSB
            0x07,                   // (  7) wTotalLengthLSB ?????
            0x00,                   // (  0) wTotalLengthMSB

            // ----- EP Descriptor - Endpoint - MIDI OUT
            0x07,                   // (  7) bLength
            0x05,                   // (  5) bDescriptorType
            (epIdx) + EPNUM_MIDI,             // (  1) bEndpointAddress
            0x02,                   // (  2) bmAttributes
            0x40,                   // (  0) wMaxPacketSizeLSB
            0x00,                   // (  2) wMaxPacketSizeMSB
            0x00,                   // (  0) bInterval
            // ----- Audio MS Descriptor - CS Endpoint - MS General 2.0
            0x04 + gtbInId.length,                   // (  6) bLength
            0x25,                   // ( 37) bDescriptorType
            0x02,                   // (  2) bDescriptorSubtype
            gtbInId.length,         // (  1) bNumGrpTrmBlock
            ...gtbInId ,             // (  2) baAssoGrpTrmBlkID



            // ----- EP Descriptor - Endpoint - MIDI IN
            0x07,                   // (  7) bLength
            0x05,                   // (  5) bDescriptorType
            0x80+ (epIdx) +EPNUM_MIDI,        // (129) bEndpointAddress
            0x02,                   // (  2) bmAttributes
            0x40,                   // (  0) wMaxPacketSizeLSB
            0x00,                   // (  2) wMaxPacketSizeMSB
            0x00,                   // (  0) bInterval
            // ----- Audio MS Descriptor - CS Endpoint - MS General 2.0
            0x04 + gtbOutId.length,                   // (  6) bLength
            0x25,                   // ( 37) bDescriptorType
            0x02,                   // (  2) bDescriptorSubtype
            gtbOutId.length,              // (  2) bNumGrpTrmBlock
            ...gtbOutId                   // (  3) baAssoGrpTrmBlkID


        ]);



        //----------------
        ITF_NUM_MIDI+=2;
    })





    const TotalLength = U16_TO_U8S_LE(descriptor.length);

    descriptor[2] = TotalLength[0];
    descriptor[3] = TotalLength[1];

    let out = [];

    out.push("uint8_t const desc_fs_configuration[] = {")
    out.push(arrayToHex(descriptor,', '));
    out.push("};")

    let gtbarray= [];
    config.endpoints.map((ep,idx)=>{
        gtbarray.push(`gtb${idx}`);
        out.push(`uint8_t const gtb${idx}[] = {`)
        out.push(arrayToHex(ep.gtbDescriptor,', '));
        out.push("};")
    });
    out.push(`uint8_t const gtbLengths[] = {${config.endpoints.map(e=>e.gtbDescriptor.length).join(',')}};`)


    out.push(`uint8_t const epInterface[] = {${config.endpoints.map(e=>e.interfaceId).join(',')}};`)


    out.push(`uint8_t const *group_descr[] = {${gtbarray.join(',')}};`)

    out.push("char const* string_desc_arr [] = {")
    out.push(`"${stringIdx.join('", "')}"`)
    out.push("};")

    out.push(`uint8_t const string_desc_arr_length = ${stringIdx.length-1};`)

    return out.join("\n");

}





