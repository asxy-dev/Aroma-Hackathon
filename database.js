class BloodConnectDB {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async init() {
    try {
      if (!window.SQL) {
        const SQL = await initSqlJs({
          locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });
        window.SQL = SQL;
      }

      const savedDB = localStorage.getItem('bloodconnect_database');
      if (savedDB) {
        const uInt8Array = new Uint8Array(JSON.parse(savedDB));
        this.db = new SQL.Database(uInt8Array);
      } else {
        this.db = new SQL.Database();
        this.createTables();
      }
      
      this.initialized = true;
      this.saveDatabase();
    } catch (error) {
      console.error('Database initialization failed:', error);
    }
  }

  createTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        blood_type TEXT,
        age INTEGER,
        location TEXT,
        user_type TEXT NOT NULL,
        password TEXT,
        available BOOLEAN DEFAULT 1,
        last_donation_date DATE,
        total_donations INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS blood_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_name TEXT NOT NULL,
        requester_email TEXT,
        requester_phone TEXT NOT NULL,
        blood_type TEXT NOT NULL,
        units_needed INTEGER NOT NULL,
        hospital TEXT NOT NULL,
        urgency_level TEXT NOT NULL,
        details TEXT,
        status TEXT DEFAULT 'pending',
        latitude REAL,
        longitude REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        fulfilled_at DATETIME
      )`,
      
      `CREATE TABLE IF NOT EXISTS donations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        donor_id INTEGER,
        request_id INTEGER,
        units_donated INTEGER NOT NULL,
        donation_date DATE NOT NULL,
        hospital TEXT,
        verified BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (donor_id) REFERENCES users(id),
        FOREIGN KEY (request_id) REFERENCES blood_requests(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reviewer_name TEXT NOT NULL,
        reviewer_email TEXT,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        review_text TEXT NOT NULL,
        photo_url TEXT,
        verified BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_name TEXT NOT NULL,
        description TEXT,
        event_date DATE NOT NULL,
        location TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        max_participants INTEGER,
        current_participants INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS event_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER,
        user_id INTEGER,
        registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        attended BOOLEAN DEFAULT 0,
        FOREIGN KEY (event_id) REFERENCES events(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        hospital_name TEXT,
        subscription_plan TEXT,
        subscription_amount INTEGER,
        subscription_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        subscription_status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    tables.forEach(sql => {
      try {
        this.db.run(sql);
      } catch (error) {
        console.error('Error creating table:', error);
      }
    });
  }

  saveDatabase() {
    if (this.db) {
      const data = this.db.export();
      localStorage.setItem('bloodconnect_database', JSON.stringify(Array.from(data)));
    }
  }

  async registerUser(userData) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO users (name, email, phone, blood_type, age, location, user_type, password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run([
        userData.name,
        userData.email || null,
        userData.phone,
        userData.bloodType || userData.blood_type,
        userData.age || null,
        userData.location || null,
        userData.type || userData.user_type,
        userData.password
      ]);
      
      this.saveDatabase();
      
      const userStmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
      userStmt.bind([result.insertId]);
      userStmt.step();
      const user = userStmt.getAsObject();
      
      return { success: true, user, userId: result.insertId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async loginUser(email, password) {
    try {
      const stmt = this.db.prepare('SELECT * FROM users WHERE email = ? AND password = ?');
      stmt.bind([email, password]);
      
      if (stmt.step()) {
        const user = stmt.getAsObject();
        return { success: true, user };
      }
      
      return { success: false, error: 'Invalid email or password' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async addBloodRequest(requestData) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO blood_requests (patient_name, requester_email, requester_phone, blood_type, units_needed, hospital, urgency_level, details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run([
        requestData.patientName,
        requestData.email || null,
        requestData.phone || requestData.emergencyPhone,
        requestData.bloodType,
        requestData.units || 1,
        requestData.hospital,
        requestData.urgency,
        requestData.details
      ]);
      
      this.saveDatabase();
      return { success: true, requestId: result.insertId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async addReview(reviewData) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO reviews (reviewer_name, reviewer_email, rating, review_text, photo_url)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run([
        reviewData.reviewerName,
        reviewData.reviewerEmail || null,
        reviewData.rating,
        reviewData.reviewText,
        reviewData.photoUrl || null
      ]);
      
      this.saveDatabase();
      return { success: true, reviewId: result.insertId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async registerForEvent(eventId, userId) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO event_registrations (event_id, user_id)
        VALUES (?, ?)
      `);
      
      const result = stmt.run([eventId, userId]);
      this.saveDatabase();
      return { success: true, registrationId: result.insertId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getStatistics() {
    try {
      const stats = {};
      
      let stmt = this.db.prepare('SELECT COUNT(*) as count FROM users WHERE user_type = "donor"');
      stmt.step();
      stats.totalDonors = stmt.getAsObject().count;
      
      stmt = this.db.prepare('SELECT SUM(units_donated) as total FROM donations WHERE verified = 1');
      stmt.step();
      stats.totalUnits = stmt.getAsObject().total || 0;
      
      stmt = this.db.prepare('SELECT COUNT(DISTINCT donor_id) as count FROM donations WHERE verified = 1');
      stmt.step();
      stats.livesSaved = stmt.getAsObject().count * 3;
      
      return stats;
    } catch (error) {
      return { totalDonors: 0, totalUnits: 0, livesSaved: 0 };
    }
  }

  async getReviews(limit = 10) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM reviews 
        ORDER BY created_at DESC 
        LIMIT ?
      `);
      stmt.bind([limit]);
      
      const reviews = [];
      while (stmt.step()) {
        reviews.push(stmt.getAsObject());
      }
      return reviews;
    } catch (error) {
      return [];
    }
  }

  async getUserById(id) {
    try {
      const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
      stmt.bind([id]);
      
      if (stmt.step()) {
        return stmt.getAsObject();
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async getAllUsers() {
    try {
      const stmt = this.db.prepare('SELECT * FROM users ORDER BY created_at DESC');
      const users = [];
      while (stmt.step()) {
        users.push(stmt.getAsObject());
      }
      return users;
    } catch (error) {
      return [];
    }
  }

  async getAllBloodRequests() {
    try {
      const stmt = this.db.prepare('SELECT * FROM blood_requests ORDER BY created_at DESC');
      const requests = [];
      while (stmt.step()) {
        requests.push(stmt.getAsObject());
      }
      return requests;
    } catch (error) {
      return [];
    }
  }

  async getAllDonations() {
    try {
      const stmt = this.db.prepare(`
        SELECT d.*, u.name as donor_name, br.patient_name, br.hospital
        FROM donations d
        LEFT JOIN users u ON d.donor_id = u.id
        LEFT JOIN blood_requests br ON d.request_id = br.id
        ORDER BY d.created_at DESC
      `);
      const donations = [];
      while (stmt.step()) {
        donations.push(stmt.getAsObject());
      }
      return donations;
    } catch (error) {
      return [];
    }
  }

  async registerAdmin(adminData) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO admins (email, password, hospital_name, subscription_plan, subscription_amount)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run([
        adminData.email,
        adminData.password,
        adminData.hospital_name || null,
        adminData.subscription_plan,
        adminData.subscription_amount
      ]);
      
      this.saveDatabase();
      return { success: true, adminId: result.insertId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async loginAdmin(email, password) {
    try {
      const stmt = this.db.prepare('SELECT * FROM admins WHERE email = ? AND password = ?');
      stmt.bind([email, password]);
      
      if (stmt.step()) {
        const admin = stmt.getAsObject();
        return { success: true, admin };
      }
      
      return { success: false, error: 'Invalid email or password' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateRequestStatus(requestId, status) {
    try {
      const stmt = this.db.prepare('UPDATE blood_requests SET status = ? WHERE id = ?');
      stmt.run([status, requestId]);
      this.saveDatabase();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async addDonation(donationData) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO donations (donor_id, request_id, units_donated, donation_date, hospital, verified)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run([
        donationData.donor_id,
        donationData.request_id || null,
        donationData.units_donated,
        donationData.donation_date,
        donationData.hospital,
        donationData.verified || 0
      ]);
      
      const updateStmt = this.db.prepare(`
        UPDATE users SET 
        total_donations = total_donations + 1,
        last_donation_date = ?
        WHERE id = ?
      `);
      updateStmt.run([donationData.donation_date, donationData.donor_id]);
      
      this.saveDatabase();
      return { success: true, donationId: result.insertId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async searchDonors(bloodType, location) {
    try {
      let sql = 'SELECT * FROM users WHERE user_type = "donor" AND available = 1';
      const params = [];
      
      if (bloodType) {
        sql += ' AND (blood_type = ? OR blood_type = "O-")';
        params.push(bloodType);
      }
      
      if (location) {
        sql += ' AND location LIKE ?';
        params.push(`%${location}%`);
      }
      
      const stmt = this.db.prepare(sql);
      stmt.bind(params);
      
      const donors = [];
      while (stmt.step()) {
        donors.push(stmt.getAsObject());
      }
      return donors;
    } catch (error) {
      return [];
    }
  }
}

window.bloodConnectDB = new BloodConnectDB();