import bwipjs from 'bwip-js';
export async function generateBarcodeImage(barcode) {
    return await bwipjs.toBuffer({
        bcid: 'code128',
        text: barcode,
        scale: 2,
        height: 10,
        includetext: true,
    });
}
