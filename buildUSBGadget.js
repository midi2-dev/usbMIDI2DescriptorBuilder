
function buildGadget(config) {
    let out=[];
    out.push(`#!/bin/bash`);
    out.push(`modprobe libcomposite`);
    out.push(`cd /sys/kernel/config/usb_gadget/`);
    out.push(`mkdir gadget`);
    out.push(`cd gadget`);

    out.push(`mkdir configs/c.1`);

    out.push(`echo ${config.idVendor} > idVendor`);
    out.push(`echo ${config.idProduct} > idProduct`);
// out.push(`echo 0x0100 > bcdDevice`);
// out.push(`echo 0x0200 > bcdUSB`);

    out.push(`mkdir -p strings/0x409`);
    out.push(`echo "${config.serialNumber}" > strings/0x409/serialnumber`);
    out.push(`echo "${config.manufacturer}" > strings/0x409/manufacturer`);
    out.push(`echo "${config.product}" > strings/0x409/product`);

    out.push(`mkdir -p configs/c.1/strings/0x409`);
    out.push(`echo "${config.product}" > configs/c.1/strings/0x409/configuration`);
    out.push(`echo ${config.power} > configs/c.1/MaxPower`);


    if (config.CDC) {
        out.push(`mkdir -p functions/acm.usb0`);
        out.push(`ln -s functions/acm.usb0 configs/c.1/`);
    }

    out.push(`mkdir -p functions/midi2.usb0`);
    out.push(`echo "${config.product}" > functions/midi2.usb0/iface_name`);

    if (config.processUmpManually) {
        out.push(`echo 0 > functions/midi2.usb0/process_ump`);
    }

    config.endpoints.map((ep, idx) => {
        if (idx) {
            out.push(`mkdir -p functions/midi2.usb0/ep.${idx}`);
        }
        out.push(`echo "${ep.name}" > functions/midi2.usb0/ep.${idx}/ep_name`);
        out.push(`echo "${ep.productId}" > functions/midi2.usb0/ep.${idx}/product_id`);

        out.push(`echo ${ep.defaultGTBProtocol || 1} > functions/midi2.usb0/ep.${idx}/protocol`);

        //"0x"+("000000" + Number((m[0] << 16) + (m[1]<<8) + m[2]).toString(16)).slice (-6).toUpperCase();
        out.push(`echo 0x${ep.familyId[0]} > functions/midi2.usb0/ep.${idx}/family`);
        out.push(`echo 0x${ep.modelId} > functions/midi2.usb0/ep.${idx}/model`);
        out.push(`echo ${config.manufacturerId} > functions/midi2.usb0/ep.${idx}/manufacturer`);
        out.push(`echo 0x${config.version} > functions/midi2.usb0/ep.${idx}/sw_revision`);

        ep.blocks.map((gtb, gidx) => {
            if (idx || gidx) {
                out.push(`mkdir -p functions/midi2.usb0/ep.${idx}/block.${gidx}`);
            }
            out.push(`echo "${gtb.name}" > functions/midi2.usb0/ep.${idx}/block.${gidx}/name`);
            out.push(`echo ${gtb.firstGroup - 1} > functions/midi2.usb0/ep.${idx}/block.${gidx}/first_group`);
            out.push(`echo ${gtb.numOfGroups} > functions/midi2.usb0/ep.${idx}/block.${gidx}/num_groups`);

            out.push(`echo ${gtb.in && gtb.out ? 3 : gtb.out ? 2 : 1} > functions/midi2.usb0/ep.${idx}/block.${gidx}/direction`);
            if (gtb.uihintIn !== undefined || gtb.uihintOut !== undefined) {
                out.push(`echo ${gtb.uihintIn && gtb.uihintOut ? 3 : gtb.uihintOut ? 2 : 1} > functions/midi2.usb0/ep.${idx}/block.${gidx}/ui_hint`);
            }

            if (gtb.isMIDI1) {
                out.push(`echo 1 > functions/midi2.usb0/ep.${idx}/block.${gidx}/is_midi1`);
            }
        });


    });
    out.push(`ln -s functions/midi2.usb0 configs/c.1/`);
    out.push('echo `ls /sys/class/udc` > UDC');
    return out.join("\n");
}












