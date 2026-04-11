const escpos = require('escpos');
escpos.USB = require('escpos-usb');

function printReceipt(data) {

  const device = new escpos.USB();
  const printer = new escpos.Printer(device);

  device.open((err) => {

    if (err) {
      console.log("Printer error:", err);
      return;
    }

    printer
      .align('CT')
      .text("GAME CENTER REPORT")
      .text("----------------------")
      .align('LT')
      .text("Receipt: " + data.receipt)
      .text("Station: " + data.station)
      .text("Start: " + data.start)
      .text("End: " + data.end)
      .text("Amount: ₦" + data.amount);

    if (data.extra) {
      printer
        .text("----------------------")
        .text(data.extra);
    }

    printer
      .text("----------------------")
      .text("Thank you")
      .cut()
      .close();
  });
}

module.exports = printReceipt;