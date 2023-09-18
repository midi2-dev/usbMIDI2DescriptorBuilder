
const config= require('../config.json');

console.log(`#!/bin/bash`);
console.log(`cd /sys/kernel/config/usb_gadget/`);
console.log(`mkdir gadget`);
console.log(`cd gadget`);

console.log(`mkdir configs/c.1`);

console.log(`echo ${config.idVendor} > idVendor`);
console.log(`echo ${config.idProduct} > idProduct`);
// console.log(`echo 0x0100 > bcdDevice`);
// console.log(`echo 0x0200 > bcdUSB`);

console.log(`mkdir -p strings/0x409`);
console.log(`echo "${config.serialNumber}" > strings/0x409/serialnumber`);
console.log(`echo "${config.manufacturer}" > strings/0x409/manufacturer`);
console.log(`echo "${config.product}" > strings/0x409/product`);

console.log(`mkdir -p configs/c.1/strings/0x409`);
console.log(`echo "${config.product}" > configs/c.1/strings/0x409/configuration`);
console.log(`echo ${config.power} > configs/c.1/MaxPower`);


if(config.CDC) {
    console.log(`mkdir -p functions/acm.usb0`);
    console.log(`ln -s functions/acm.usb0 configs/c.1/`);
}

console.log(`mkdir -p functions/midi2.usb0`);
console.log(`echo "${config.product}" > functions/midi2.usb0/iface_name`);

if(config.processUmpManually){
    console.log(`echo 0 > functions/midi2.usb0/process_ump`);
}

config.endpoints.map((ep,idx)=>{
    console.log(`echo "${ep.name}" > functions/midi2.usb0/ep.${idx}/name`);
    console.log(`echo "${ep.productId}" > functions/midi2.usb0/ep.${idx}/product_id`);

    console.log(`echo ${ep.defaultGTBProtocol} > functions/midi2.usb0/ep.${idx}/protocol`);

    //"0x"+("000000" + Number((m[0] << 16) + (m[1]<<8) + m[2]).toString(16)).slice (-6).toUpperCase();
    console.log(`echo 0x${("0000" + Number( (ep.familyId[0]<<8) + ep.familyId[1]).toString(16)).slice (-4).toUpperCase()} > functions/midi2.usb0/ep.${idx}/family`);
    console.log(`echo 0x${("0000" + Number( (ep.modelId[0]<<8) + ep.modelId[1]).toString(16)).slice (-4).toUpperCase()} > functions/midi2.usb0/ep.${idx}/model`);
    console.log(`echo 0x${("000000" + Number((config.manufacturerId[0] << 16) + (config.manufacturerId[1]<<8) + config.manufacturerId[2]).toString(16)).slice (-6).toUpperCase()} > functions/midi2.usb0/ep.${idx}/manufacturer`);
    console.log(`echo 0x${("00000000" + Number((config.version[0] << 24) +(config.version[1] << 16) + (config.version[2]<<8) + config.version[3]).toString(16)).slice (-8).toUpperCase()} > functions/midi2.usb0/ep.${idx}/sw_revision`);

    ep.blocks.map((gtb, gidx)=>{
        console.log(`echo "${gtb.name}" > functions/midi2.usb0/ep.${idx}/block.${gidx}/name`);
        console.log(`echo ${gtb.firstGroup-1} > functions/midi2.usb0/ep.${idx}/block.${gidx}/first_group`);
        console.log(`echo ${gtb.numOfGroups} > functions/midi2.usb0/ep.${idx}/block.${gidx}/num_groups`);

        console.log(`echo ${gtb.in && gtb.out? 3: gtb.out?2: 1} > functions/midi2.usb0/ep.${idx}/block.${gidx}/direction`);
        if(gtb.uihintIn !== undefined || gtb.uihintOut !==undefined){
            console.log(`echo ${gtb.uihintIn && gtb.uihintOut? 3: gtb.uihintOut?2: 1} > functions/midi2.usb0/ep.${idx}/block.${gidx}/ui_hint`);
        }

        if(gtb.isMIDI1){
            console.log(`echo 1 > functions/midi2.usb0/ep.${idx}/block.${gidx}/is_midi1`);
        }
    });

    console.log(`ln -s functions/midi2.usb0 configs/c.1/`);

});












