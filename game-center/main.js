// ================= main.js =================

const {
  app,
  BrowserWindow,
  ipcMain
} = require("electron");

const db = require("./db");

let win;

// ================= WINDOW =================

function createWindow(){

  win = new BrowserWindow({

    width:1400,
    height:900,

    webPreferences:{
      nodeIntegration:true,
      contextIsolation:false
    }

  });

  win.loadFile("index.html");
}

app.whenReady().then(createWindow);

// ================= LOGIN =================

ipcMain.on("login",(e,pin)=>{

  db.get(
    "SELECT * FROM admin WHERE id=1",
    (err,row)=>{

      const password =
        row?.password || "1234";

      if(pin === password){

        e.reply("login-result",{
          role:"admin"
        });

      }else{

        e.reply("login-result",{
          role:"cashier"
        });

      }
    }
  );
});

// ================= PASSWORD =================

ipcMain.on("change-password",(e,data)=>{

  db.get(
    "SELECT * FROM admin WHERE id=1",
    (err,row)=>{

      if(data.oldPassword !== row.password){

        return e.reply("password-result",{
          message:"Old password incorrect"
        });
      }

      db.run(
        "UPDATE admin SET password=? WHERE id=1",
        [data.newPassword],
        ()=>{

          e.reply("password-result",{
            message:"Password changed"
          });

        }
      );
    }
  );
});

// ================= SESSION =================

ipcMain.on("save-session",(e,data)=>{

  const invoice = Date.now();

  db.run(`
    INSERT INTO sessions(

      invoice,
      station,
      pricePerGame,
      gameMinutes,
      customerMinutes,
      amount,
      startTime,
      endTime,
      date

    )

    VALUES(?,?,?,?,?,?,?,?,?)

  `,[

    invoice,
    data.station,
    data.pricePerGame,
    data.gameMinutes,
    data.customerMinutes,
    data.amount,
    data.startTime,
    data.endTime,
    data.date

  ],()=>{

    win.webContents.send("saved");

  });

});
// ================= PRODUCT =================

ipcMain.on("add-product",(e,data)=>{

  db.run(`
    INSERT INTO products(
      name,
      price,
      qty
    )

    VALUES(?,?,?)

  `,[

    data.name,
    data.price,
    data.qty

  ],()=>{

    win.webContents.send("saved");

  });

});

// ================= SELL =================

// ================= SELL (FIXED) =================

ipcMain.on("sell-product", (e, data) => {

  const { id, qty } = data;

  db.get(
    "SELECT * FROM products WHERE id = ?",
    [id],
    (err, product) => {

      if (!product) {
        return e.reply("error", "Product not found");
      }

      if (product.qty < qty) {
        return e.reply("error", "Not enough stock");
      }

      const newQty = product.qty - qty;
      const total = product.price * qty;
      const invoice = Date.now();
      const date = new Date().toISOString().split("T")[0];

      // 1. Update stock
      db.run(
        "UPDATE products SET qty = ? WHERE id = ?",
        [newQty, id]
      );

      // 2. Save sale
      db.run(
        `INSERT INTO sales(invoice, product, qty, total, date)
         VALUES(?,?,?,?,?)`,
        [invoice, product.name, qty, total, date],
        () => {
          e.reply("saved");
        }
      );
    }
  );
});
// ================= GET DATA =================

ipcMain.on("get-data",(e)=>{

  db.all(
    "SELECT * FROM sessions ORDER BY id DESC",
    (err,sessions)=>{

      db.all(
        "SELECT * FROM products ORDER BY id DESC",
        (err2,products)=>{

          db.all(
            "SELECT * FROM sales ORDER BY id DESC",
            (err3,sales)=>{

              e.reply("data",{
                sessions,
                products,
                sales
              });

            }
          );
        }
      );
    }
  );
});

// ================= RESET =================

ipcMain.on("factory-reset",()=>{

  db.run("DELETE FROM sessions");
  db.run("DELETE FROM products");
  db.run("DELETE FROM sales");

  win.webContents.send("saved");
});