
CREATE TABLE users (
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


CREATE TABLE blood_requests (
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


CREATE TABLE donations (
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


CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    organizer TEXT,
    expected_donors INTEGER,
    status TEXT DEFAULT 'upcoming',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE event_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    attended BOOLEAN DEFAULT 0,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);


CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reviewer_name TEXT NOT NULL,
    reviewer_email TEXT,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5) NOT NULL,
    review_text TEXT NOT NULL,
    photo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'approved'
);


CREATE TABLE hospital_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_name TEXT NOT NULL,
    hospital_email TEXT UNIQUE NOT NULL,
    admin_password TEXT NOT NULL,
    plan_type TEXT CHECK(plan_type IN ('Basic', 'Standard', 'Advanced')) NOT NULL,
    monthly_fee REAL NOT NULL,
    subscription_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATETIME,
    status TEXT DEFAULT 'active',
    esewa_number TEXT,
    payment_status TEXT DEFAULT 'pending'
);


CREATE TABLE emergency_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    blood_type TEXT NOT NULL,
    hospital TEXT NOT NULL,
    emergency_details TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME
);


INSERT INTO users (name, email, phone, blood_type, age, location, user_type, password, available) VALUES
('Raj Kumar', 'raj@example.com', '+977-98XXXXXXX1', 'O+', 28, 'Kathmandu', 'donor', 'default123', 1),
('Maya Sharma', 'maya@example.com', '+977-98XXXXXXX2', 'A+', 32, 'Kathmandu', 'donor', 'default123', 1),
('Hari Thapa', 'hari@example.com', '+977-98XXXXXXX3', 'B-', 25, 'Kathmandu', 'donor', 'default123', 0),
('Sita Lama', 'sita@example.com', '+977-98XXXXXXX4', 'O-', 30, 'Kathmandu', 'donor', 'default123', 1);

INSERT INTO events (name, date, location, description, organizer, expected_donors) VALUES
('Community Blood Drive', '2024-12-20', 'City Center Mall', 'Annual community blood donation event', 'Red Cross Society', 100),
('University Health Fair', '2024-12-25', 'Tribhuvan University', 'Blood donation camp for students and staff', 'TU Health Department', 150);

INSERT INTO reviews (reviewer_name, reviewer_email, rating, review_text) VALUES
('Ram Sharma', 'ram@example.com', 5, 'BloodConnect helped me find a donor for my mother within 2 hours during an emergency. The system is incredible and truly saves lives.'),
('Sita Patel', 'sita@example.com', 5, 'As a regular donor, I love how easy it is to register and get notified when my blood type is needed. I have already helped 5 people!');