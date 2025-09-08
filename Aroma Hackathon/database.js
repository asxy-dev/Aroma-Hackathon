class BloodConnectDatabase {
    constructor() {
        this.db = null;
        this.initialized = false;
    }

    async init() {
        try {
            if (typeof initSqlJs === 'undefined') {
                console.error('SQL.js library not loaded');
                return false;
            }

            const SQL = await initSqlJs({
                locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
            });

            const savedDb = localStorage.getItem('bloodconnect_database');
            
            if (savedDb) {
                try {
                    const buffer = new Uint8Array(JSON.parse(savedDb));
                    this.db = new SQL.Database(buffer);
                } catch (e) {
                    console.error('Failed to load saved database, creating new one');
                    this.db = new SQL.Database();
                    await this.createTables();
                    await this.insertSampleData();
                }
            } else {
                this.db = new SQL.Database();
                await this.createTables();
                await this.insertSampleData();
            }
            
            this.initialized = true;
            console.log('Database initialized successfully');
            return true;
        } catch (error) {
            console.error('Database initialization failed:', error);
            return false;
        }
    }

    async createTables() {
        const schema = `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE,
                phone TEXT NOT NULL,
                blood_type TEXT,
                age INTEGER,
                location TEXT,
                user_type TEXT CHECK(user_type IN ('donor', 'recipient')) NOT NULL,
                password TEXT,
                available BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS blood_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_name TEXT NOT NULL,
                contact_email TEXT,
                contact_phone TEXT NOT NULL,
                blood_type TEXT NOT NULL,
                units_needed INTEGER NOT NULL,
                hospital TEXT NOT NULL,
                urgency_level TEXT CHECK(urgency_level IN ('routine', 'urgent', 'emergency')) NOT NULL,
                additional_details TEXT,
                status TEXT DEFAULT 'pending',
                requester_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (requester_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS donations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                donor_id INTEGER NOT NULL,
                recipient_id INTEGER,
                blood_type TEXT NOT NULL,
                units_donated INTEGER DEFAULT 1,
                donation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                hospital TEXT,
                notes TEXT,
                FOREIGN KEY (donor_id) REFERENCES users(id),
                FOREIGN KEY (recipient_id) REFERENCES blood_requests(id)
            );

            CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reviewer_name TEXT NOT NULL,
                reviewer_email TEXT,
                rating INTEGER CHECK(rating >= 1 AND rating <= 5) NOT NULL,
                review_text TEXT NOT NULL,
                photo_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'approved'
            );
        `;

        try {
            this.db.exec(schema);
            console.log('Tables created successfully');
            return true;
        } catch (error) {
            console.error('Error creating tables:', error);
            return false;
        }
    }

    async insertSampleData() {
        const sampleData = `
            INSERT INTO users (name, email, phone, blood_type, age, location, user_type, password, available) VALUES
            ('Raj Kumar', 'raj@example.com', '+977-98XXXXXXX1', 'O+', 28, 'Kathmandu', 'donor', 'default123', 1),
            ('Maya Sharma', 'maya@example.com', '+977-98XXXXXXX2', 'A+', 32, 'Kathmandu', 'donor', 'default123', 1),
            ('Hari Thapa', 'hari@example.com', '+977-98XXXXXXX3', 'B-', 25, 'Kathmandu', 'donor', 'default123', 0),
            ('Sita Lama', 'sita@example.com', '+977-98XXXXXXX4', 'O-', 30, 'Kathmandu', 'donor', 'default123', 1),
            ('Ram Sharma', 'ram.sharma@example.com', '+977-98XXXXXXX5', 'B+', 35, 'Kathmandu', 'recipient', 'default123', 1),
            ('Gita Patel', 'gita@example.com', '+977-98XXXXXXX6', 'A-', 29, 'Kathmandu', 'donor', 'default123', 1);

            INSERT INTO reviews (reviewer_name, reviewer_email, rating, review_text) VALUES
            ('Ram Sharma', 'ram@example.com', 5, 'BloodConnect helped me find a donor for my mother within 2 hours during an emergency. The system is incredible and truly saves lives.'),
            ('Sita Patel', 'sita@example.com', 5, 'As a regular donor, I love how easy it is to register and get notified when my blood type is needed. I have already helped 5 people!');
        `;

        try {
            this.db.exec(sampleData);
            console.log('Sample data inserted successfully');
            return true;
        } catch (error) {
            console.error('Error inserting sample data:', error);
            return false;
        }
    }

    async addRequest(requestData) {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO blood_requests (
                    patient_name, contact_email, contact_phone, blood_type, 
                    units_needed, hospital, urgency_level, additional_details, status, requester_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            stmt.bind([
                requestData.patientName,
                requestData.email || null,
                requestData.phone,
                requestData.bloodType,
                requestData.units,
                requestData.hospital,
                requestData.urgency,
                requestData.details || null,
                'pending',
                requestData.requesterId || null
            ]);
            
            stmt.step();
            const requestId = this.db.exec("SELECT last_insert_rowid()")[0].values[0][0];
            stmt.free();
            
            this.saveDatabase();
            
            return {
                success: true,
                requestId: requestId
            };
        } catch (error) {
            console.error('Error adding request:', error);
            return {
                success: false,
                error: error.message || 'Request submission failed'
            };
        }
    }

    saveDatabase() {
        try {
            if (!this.db) return false;
            const data = this.db.export();
            localStorage.setItem('bloodconnect_database', JSON.stringify(Array.from(data)));
            return true;
        } catch (error) {
            console.error('Error saving database:', error);
            return false;
        }
    }

    async registerUser(userData) {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO users (name, email, phone, blood_type, age, location, user_type, password)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            stmt.bind([
                userData.name,
                userData.email || null,
                userData.phone,
                userData.bloodType || null,
                userData.age || null,
                userData.location || null,
                userData.type || 'donor',
                userData.password || 'default123'
            ]);
            
            stmt.step();
            const userId = this.db.exec("SELECT last_insert_rowid()")[0].values[0][0];
            stmt.free();
            
            this.saveDatabase();
            
            return {
                success: true,
                userId: userId,
                user: { id: userId, ...userData }
            };
        } catch (error) {
            console.error('Error registering user:', error);
            return {
                success: false,
                error: error.message || 'Registration failed'
            };
        }
    }

    async getUserById(userId) {
        try {
            const stmt = this.db.prepare("SELECT * FROM users WHERE id = ?");
            stmt.bind([userId]);
            
            if (stmt.step()) {
                const user = stmt.getAsObject();
                stmt.free();
                return user;
            }
            
            stmt.free();
            return null;
        } catch (error) {
            console.error('Error getting user by ID:', error);
            return null;
        }
    }

    async loginUser(email, password) {
        try {
            const stmt = this.db.prepare("SELECT * FROM users WHERE email = ? AND password = ?");
            stmt.bind([email, password]);
            
            if (stmt.step()) {
                const user = stmt.getAsObject();
                stmt.free();
                return {
                    success: true,
                    user: user
                };
            }
            
            stmt.free();
            return {
                success: false,
                error: 'Invalid email or password'
            };
        } catch (error) {
            console.error('Error logging in user:', error);
            return {
                success: false,
                error: 'Login failed'
            };
        }
    }

    async getDonors(limit = 50) {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM users 
                WHERE user_type = 'donor' AND available = 1 
                ORDER BY created_at DESC 
                LIMIT ?
            `);
            stmt.bind([limit]);
            
            const donors = [];
            while (stmt.step()) {
                donors.push(stmt.getAsObject());
            }
            stmt.free();
            
            return donors;
        } catch (error) {
            console.error('Error getting donors:', error);
            return [];
        }
    }

    async getReviews(limit = 10) {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM reviews 
                WHERE status = 'approved' 
                ORDER BY created_at DESC 
                LIMIT ?
            `);
            stmt.bind([limit]);
            
            const reviews = [];
            while (stmt.step()) {
                reviews.push(stmt.getAsObject());
            }
            stmt.free();
            
            return reviews;
        } catch (error) {
            console.error('Error getting reviews:', error);
            return [];
        }
    }

    async getStatistics() {
        try {
            let stmt = this.db.prepare("SELECT COUNT(*) as count FROM users WHERE user_type = 'donor'");
            stmt.step();
            const totalDonors = stmt.getAsObject().count;
            stmt.free();
            
            stmt = this.db.prepare("SELECT COUNT(*) as count FROM donations");
            stmt.step();
            const livesSaved = stmt.getAsObject().count;
            stmt.free();
            
            stmt = this.db.prepare("SELECT SUM(units_donated) as total FROM donations");
            stmt.step();
            const totalUnits = stmt.getAsObject().total || 0;
            stmt.free();
            
            return {
                totalDonors,
                livesSaved,
                totalUnits
            };
        } catch (error) {
            console.error('Error getting statistics:', error);
            return {
                totalDonors: 0,
                livesSaved: 0,
                totalUnits: 0
            };
        }
    }

    async addReview(reviewData) {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO reviews (reviewer_name, reviewer_email, rating, review_text, photo_url)
                VALUES (?, ?, ?, ?, ?)
            `);
            
            stmt.bind([
                reviewData.reviewerName,
                reviewData.reviewerEmail || null,
                reviewData.rating,
                reviewData.reviewText,
                reviewData.photoUrl || null
            ]);
            
            stmt.step();
            stmt.free();
            
            this.saveDatabase();
            
            return {
                success: true
            };
        } catch (error) {
            console.error('Error adding review:', error);
            return {
                success: false,
                error: error.message || 'Review submission failed'
            };
        }
    }
}

window.bloodConnectDB = new BloodConnectDatabase();