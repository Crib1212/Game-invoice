const {
  app,
  BrowserWindow,
  ipcMain
} = require("electron");

const sqlite3 =
  require("sqlite3").verbose();

const db =
  new sqlite3.Database("./pos.db");

let win;

// ================= DATABASE =================

// ADMIN
db.run(`
  CREATE TABLE IF NOT EXISTS admin(
    id INTEGER PRIMARY KEY,
    password TEXT
  )
`);

db.get(
  "SELECT * FROM admin WHERE id=1",
  (err,row)=>{

    if(!row){

      db.run(`
        INSERT INTO admin(
          id,
          password
        )
        VALUES(1,'1234')
      `);

    }

  }
);

// SESSIONS
db.run(`
  CREATE TABLE IF NOT EXISTS sessions(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    invoice TEXT,
    station TEXT,
    pricePerGame REAL,
    gameMinutes INTEGER,
    customerMinutes INTEGER,
    amount REAL,
    startTime INTEGER,
    endTime INTEGER,
    date TEXT

  )
`);

// PRODUCTS
db.run(`
  CREATE TABLE IF NOT EXISTS products(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT,
    price REAL,
    qty INTEGER

  )
`);

// SALES
db.run(`
  CREATE TABLE IF NOT EXISTS sales(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    invoice TEXT,
    product TEXT,
    qty INTEGER,
    total REAL,
    date TEXT

  )
`);

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

app.whenReady().then(()=>{

  createWindow();

});

app.on("window-all-closed",()=>{

  if(process.platform !== "darwin"){
    app.quit();
  }

});

// ================= LOGIN =================

ipcMain.on("login",(e,pin)=>{

  db.get(
    "SELECT * FROM admin WHERE id=1",
    (err,row)=>{

      if(err){
        return e.reply("error","Database error");
      }

      if(!row){
        return e.reply("login-result",{
          role:"cashier"
        });
      }

      if(pin === row.password){

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

      if(err){
        return e.reply(
          "password-result",
          {
            message:"Database error"
          }
        );
      }

      if(!row){

        return e.reply(
          "password-result",
          {
            message:"Admin not found"
          }
        );

      }

      if(data.oldPassword !== row.password){

        return e.reply(
          "password-result",
          {
            message:"Wrong old password"
          }
        );

      }

      db.run(
        "UPDATE admin SET password=? WHERE id=1",
        [data.newPassword],
        ()=>{

          e.reply(
            "password-result",
            {
              message:"Password changed"
            }
          );

        }
      );

    }
  );

});

// ================= SAVE SESSION =================

ipcMain.on("save-session",(e,data)=>{

  const invoice =
    "INV-" + Date.now();

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

// ================= ADD PRODUCT =================

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

// ================= SELL PRODUCT =================

ipcMain.on("sell-product",(e,data)=>{

  const id = data.id;
  const qty = data.qty;

  db.get(
    "SELECT * FROM products WHERE id=?",
    [id],
    (err,product)=>{

      if(!product){

        return e.reply(
          "error",
          "Product not found"
        );

      }

      if(product.qty < qty){

        return e.reply(
          "error",
          "Not enough stock"
        );

      }

      const newQty =
        product.qty - qty;

      const total =
        product.price * qty;

      const invoice =
        "SALE-" + Date.now();

      const date =
        new Date()
        .toISOString()
        .split("T")[0];

      db.run(
        "UPDATE products SET qty=? WHERE id=?",
        [newQty,id],
        ()=>{

          db.run(`

            INSERT INTO sales(

              invoice,
              product,
              qty,
              total,
              date

            )

            VALUES(?,?,?,?,?)

          `,[

            invoice,
            product.name,
            qty,
            total,
            date

          ],()=>{

            win.webContents.send("saved");

          });

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