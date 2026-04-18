getDailyReport(cb) {
  const today = new Date().toDateString();

  this.db.all(
    `SELECT * FROM sessions WHERE date=? ORDER BY id DESC`,
    [today],
    (err, rows) => {
      if (err) return cb(err);

      const income = rows.reduce(
        (sum, r) => sum + (r.price || 0),
        0
      );

      // format date like 16/04/2026
      const now = new Date();
      const formattedDate =
        String(now.getDate()).padStart(2, "0") + "/" +
        String(now.getMonth() + 1).padStart(2, "0") + "/" +
        now.getFullYear();

      cb(null, {
        date: formattedDate,
        income,
        sessions: rows
      });
    }
  );
}