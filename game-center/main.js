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

// COUNTER TABLE
db.run(`
  CREATE TABLE IF NOT EXISTS counter(

    id INTEGER PRIMARY KEY,

    currentNumber INTEGER

  )
`);

db.get(
  "SELECT * FROM counter WHERE id=1",
  (err,row)=>{

    if(!row){

      db.run(`
        INSERT INTO counter(
          id,
          currentNumber
        )
        VALUES(1,0)
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

// ================= INVOICE NUMBER =================

function getNextInvoice(callback){

  db.get(
    "SELECT * FROM counter WHERE id=1",
    (err,row)=>{

      let next =
        (row.currentNumber || 0) + 1;

      db.run(
        "UPDATE counter SET currentNumber=? WHERE id=1",
        [next],
        ()=>{

          callback(next);

        }
      );

    }
  );

}

// ================= LOGIN =================

ipcMain.on("login",(e,pin)=>{

  db.get(
    "SELECT * FROM admin WHERE id=1",
    (err,row)=>{

      if(err){

        return e.reply(
          "login-result",
          {
            role:"cashier"
          }
        );

      }

      if(pin === row.password){

        e.reply(
          "login-result",
          {
            role:"admin"
          }
        );

      }else{

        e.reply(
          "login-result",
          {
            role:"cashier"
          }
        );

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

      if(data.oldPassword !== row.password){

        return e.reply(
          "password-result",
          {
            message:"Old password incorrect"
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
              message:"Password changed successfully"
            }
          );

        }
      );

    }
  );

});

// ================= SAVE SESSION =================

ipcMain.on("save-session",(e,data)=>{

  getNextInvoice((invoice)=>{

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
  const qty = Number(data.qty);

  db.get(
    "SELECT * FROM products WHERE id=?",
    [id],
    (err,product)=>{

      if(err){

        return e.reply(
          "error",
          "Database error"
        );

      }

      if(!product){

        return e.reply(
          "error",
          "Product not found"
        );

      }

      if(product.qty < qty){

        return e.reply(
          "error",
          "Insufficient stock"
        );

      }

      getNextInvoice((invoice)=>{

        const newQty =
          product.qty - qty;

        const total =
          product.price * qty;

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

      });

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

// ================= FACTORY RESET =================

ipcMain.on("factory-reset",()=>{

  db.run("DELETE FROM sessions");
  db.run("DELETE FROM products");
  db.run("DELETE FROM sales");

  db.run(
    "UPDATE counter SET currentNumber=0 WHERE id=1"
  );

  win.webContents.send("saved");

});