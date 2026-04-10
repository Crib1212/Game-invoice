
const escpos = require('escpos');
escpos.USB = require('escpos-usb');

function printReceipt(data) {

  try {

    const device = new escpos.USB();
    const printer = new escpos.Printer(device);

    device.open((error) => {

      if (error) {
        console.error("❌ Printer connection failed:", error.message);
        return;
      }

      printer
        .encode('GB18030') // FIX for ₦ and special characters
        .align('CT')
        .style('B')
        .size(1, 1)
        .text("WITTY STYZES & GAMES")
        .text("Game Center Receipt")
        .text("----------------------")
        .style('NORMAL')
        .align('LT')

        .text("Receipt: " + data.receipt)
        .text("Station: " + data.station)
        .text("Start Time: " + data.start)
        .text("End Time: " + data.end)
        .text("Amount: ₦" + data.amount)

        .text("----------------------")
        .text("Thank you for coming!")
        .text("Visit again 🙌")

        .cut()
        .close();

    });

  } catch (err) {
    console.error("❌ Printer error:", err.message);
  }
}

module.exports = printReceipt;