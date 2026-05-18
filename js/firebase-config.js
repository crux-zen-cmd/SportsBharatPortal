/* ==========================================================================
   FIREBASE CENTRAL SERVICE LAYER & CONFIGURATION
   ========================================================================== */

// Standard Web App Firebase Config Template
// Replace these with actual environment keys when deploying.
const firebaseConfig = {
  apiKey: "AIzaSyCLxgT78u7dmZa6NYNXaEWBZBxsmPOsAOM",
  authDomain: "sportsbharat-portal-yash.firebaseapp.com",
  projectId: "sportsbharat-portal-yash",
  storageBucket: "sportsbharat-portal-yash.firebasestorage.app",
  messagingSenderId: "634844615752",
  appId: "1:634844615752:web:c435fb81bcc75377d0747d",
  measurementId: "G-G5D1HG78N4"
};

// Check if we are running in real Firebase environment or using the simulator
const IS_REAL_FIREBASE = false; // Toggle to true to connect to real Firebase credentials

let firebaseInstance = null;
let db = null;
let auth = null;
let storage = null;
let analytics = null;
let messaging = null;

// Initialize Simulated/Mock Database for immediate client-side testing
class SimulatedFirestore {
  constructor() {
    this.storageKey = 'sports_portal_db';
    this.listeners = {};
    if (!localStorage.getItem(this.storageKey)) {
      this.seedDummyData();
    }
  }

  seedDummyData() {
    const defaultData = {
      users: {
        "user_demo": {
          uid: "user_demo",
          email: "athlete@sports.gov.in",
          fullName: "Rajesh Kumar",
          role: "user",
          age: 22,
          gender: "Male",
          city: "Bangalore",
          state: "Karnataka",
          country: "India",
          sportsInterests: ["Cricket", "Kabaddi", "Athletics"],
          skills: "Sprinter, Mid-order Batsman",
          profilePhoto: "",
          bio: "Grassroots sprinter targeting regional meets.",
          contactInfo: "+91 9876543210",
          badges: ["🏆 First Registration", "🏅 Grassroots Contender"],
          bookmarkIds: ["comp_kabaddi_2026"],
          certificates: []
        }
      },
      organizers: {
        "org_demo": {
          uid: "org_demo",
          email: "organizer@sports.gov.in",
          fullName: "Dr. Sunita Sharma",
          role: "organizer",
          organization: "Karnataka Athletics Association",
          city: "Bangalore",
          state: "Karnataka",
          verified: true,
          contactInfo: "+91 9988776655"
        }
      },
      admins: {
        "admin_demo": {
          uid: "admin_demo",
          email: "admin@sports.gov.in",
          fullName: "National Administrator",
          role: "admin",
          department: "Ministry of Youth Affairs & Sports"
        }
      },
      sports: [
        { id: "cricket", title: "Cricket", icon: "🏏", category: "Team" },
        { id: "football", title: "Football", icon: "⚽", category: "Team" },
        { id: "volleyball", title: "Volleyball", icon: "🏐", category: "Team" },
        { id: "kabaddi", title: "Kabaddi", icon: "💪", category: "Traditional" },
        { id: "athletics", title: "Athletics", icon: "🏃", category: "Track & Field" },
        { id: "chess", title: "Chess", icon: "♟️", category: "Indoor" },
        { id: "basketball", title: "Basketball", icon: "🏀", category: "Team" },
        { id: "badminton", title: "Badminton", icon: "🏸", category: "Racket" },
        { id: "hockey", title: "Hockey", icon: "🏑", category: "Team" },
        { id: "swimming", title: "Swimming", icon: "🏊", category: "Aquatics" }
      ],
      competitions: {
        "comp_cricket_2026": {
          id: "comp_cricket_2026",
          title: "National Grassroots Under-19 Cricket Cup",
          sportType: "Cricket",
          description: "A premier tournament for identifying potential national players for the Under-19 squad.",
          venue: "M. Chinnaswamy Stadium, Bangalore",
          state: "Karnataka",
          city: "Bangalore",
          dateTime: "2026-06-15T09:00",
          maxParticipants: 200,
          regFee: "500",
          rules: "Standard ICC rules apply. Mandatory school/college registration letter required.",
          prizeDetails: "First prize: ₹5,00,000, Second prize: ₹2,50,000, Third prize: ₹1,00,000",
          bannerUrl: "https://images.unsplash.com/photo-1540747737956-37872404a87a?w=800&auto=format&fit=crop&q=60",
          organizerId: "org_demo",
          organizerName: "Dr. Sunita Sharma",
          status: "upcoming",
          createdAt: "2026-05-10T12:00:00Z"
        },
        "comp_kabaddi_2026": {
          id: "comp_kabaddi_2026",
          title: "Bharat Kabaddi Pro League - Delhi Qualifiers",
          sportType: "Kabaddi",
          description: "Regional qualifiers for the upcoming Pro Kabaddi development tier.",
          venue: "Indira Gandhi Indoor Stadium, New Delhi",
          state: "Delhi",
          city: "New Delhi",
          dateTime: "2026-05-28T16:00",
          maxParticipants: 120,
          regFee: "0",
          rules: "Standard AKFI rules. Group weights capped at 85kg max.",
          prizeDetails: "Direct entry into Bharat Pro League camp + ₹2,00,000 grant",
          bannerUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop&q=60",
          organizerId: "org_demo",
          organizerName: "Dr. Sunita Sharma",
          status: "ongoing",
          createdAt: "2026-05-01T10:00:00Z"
        },
        "comp_badminton_2026": {
          id: "comp_badminton_2026",
          title: "All-India Open Badminton Championship",
          sportType: "Badminton",
          description: "Annual national ranking championship. Open to players above 16 years.",
          venue: "Pullela Gopichand Badminton Academy, Hyderabad",
          state: "Telangana",
          city: "Hyderabad",
          dateTime: "2026-04-10T08:00",
          maxParticipants: 300,
          regFee: "1000",
          rules: "BAI standards. Single-elimination tree format.",
          prizeDetails: "National ranking points + ₹10,00,000 aggregate pool prize.",
          bannerUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=60",
          organizerId: "org_demo",
          organizerName: "Dr. Sunita Sharma",
          status: "completed",
          createdAt: "2026-03-01T09:00:00Z"
        }
      },
      registrations: {},
      notifications: [
        {
          id: "notif_1",
          userId: "user_demo",
          title: "Welcome Athlete",
          message: "Welcome to SportsBharat! Set up your profile and explore regional competitions today.",
          type: "system",
          read: false,
          timestamp: "2026-05-18T10:00:00Z"
        }
      ],
      news: [
        {
          id: "news_1",
          title: "Khelo India 2026 Games Announced",
          excerpt: "Ministry announces expansion of Khelo India to include 5 traditional sports disciplines, enhancing grassroots discovery.",
          content: "The Ministry of Youth Affairs and Sports has officially sanctioned the Khelo India Games 2026 roadmap, introducing robust funding structures and state-of-the-art regional complexes.",
          date: "2026-05-17",
          imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60"
        },
        {
          id: "news_2",
          title: "Digital Certificate Integration Live",
          excerpt: "Athletes can now download government-validated digital certificates with QR checks directly from their dashboards.",
          content: "As part of the Digital India initiative, all future sports participation certificates will feature tamper-proof cryptographic seals validation.",
          date: "2026-05-16",
          imageUrl: "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&auto=format&fit=crop&q=60"
        }
      ],
      attendance: {},
      liveScores: {
        "live_kabaddi": {
          sport: "Kabaddi",
          matchName: "Delhi Panthers vs Bangalore Bulls",
          score: "28 - 24",
          status: "Live - 2nd Half",
          timestamp: "2026-05-18T14:00:00Z"
        }
      },
      feedback: []
    };
    localStorage.setItem(this.storageKey, JSON.stringify(defaultData));
  }

  getData() {
    return JSON.parse(localStorage.getItem(this.storageKey));
  }

  saveData(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
    // Trigger listeners
    Object.keys(this.listeners).forEach(path => {
      this.listeners[path].forEach(callback => callback(this.extractCollection(data, path)));
    });
  }

  extractCollection(data, path) {
    const parts = path.split('/');
    let target = data;
    for (let part of parts) {
      if (target && target[part]) {
        target = target[part];
      } else {
        return null;
      }
    }
    return target;
  }

  // Firestore standard mocks
  async getDoc(collection, docId) {
    const data = this.getData();
    if (data[collection] && data[collection][docId]) {
      return { exists: true, data: () => data[collection][docId], id: docId };
    }
    return { exists: false, data: () => null };
  }

  async getCollection(collectionName) {
    const data = this.getData();
    const col = data[collectionName] || {};
    return Object.keys(col).map(key => ({
      id: key,
      ...col[key],
      data: () => col[key]
    }));
  }

  async setDoc(collection, docId, docData) {
    const data = this.getData();
    if (!data[collection]) data[collection] = {};
    data[collection][docId] = { ...data[collection][docId], ...docData };
    this.saveData(data);
    return { success: true };
  }

  async addDoc(collection, docData) {
    const id = collection + '_' + Math.random().toString(36).substr(2, 9);
    await this.setDoc(collection, id, { id, ...docData });
    return { id, success: true };
  }

  async updateDoc(collection, docId, updateData) {
    const data = this.getData();
    if (data[collection] && data[collection][docId]) {
      data[collection][docId] = { ...data[collection][docId], ...updateData };
      this.saveData(data);
      return { success: true };
    }
    throw new Error("Document not found");
  }

  async deleteDoc(collection, docId) {
    const data = this.getData();
    if (data[collection] && data[collection][docId]) {
      delete data[collection][docId];
      this.saveData(data);
      return { success: true };
    }
    return { success: false };
  }

  onSnapshot(path, callback) {
    if (!this.listeners[path]) this.listeners[path] = [];
    this.listeners[path].push(callback);
    // Initial call
    callback(this.extractCollection(this.getData(), path));
    
    // Return unsubscribe function
    return () => {
      this.listeners[path] = this.listeners[path].filter(cb => cb !== callback);
    };
  }
}

// Simulated Auth Service
class SimulatedAuth {
  constructor() {
    this.currentUserKey = 'sports_portal_current_user';
    this.currentUser = JSON.parse(localStorage.getItem(this.currentUserKey)) || null;
    this.authListeners = [];
  }

  onAuthStateChanged(callback) {
    this.authListeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.authListeners = this.authListeners.filter(cb => cb !== callback);
    };
  }

  async signInWithEmailAndPassword(email, password) {
    const firestore = new SimulatedFirestore();
    const data = firestore.getData();

    // Check Users, Organizers, Admins
    let foundUser = null;
    for (let role of ['users', 'organizers', 'admins']) {
      const collection = data[role] || {};
      const match = Object.values(collection).find(u => u.email === email);
      if (match) {
        foundUser = match;
        break;
      }
    }

    if (foundUser) {
      this.currentUser = foundUser;
      localStorage.setItem(this.currentUserKey, JSON.stringify(foundUser));
      this.notifyListeners();
      return { user: foundUser };
    } else {
      throw new Error("Authentication failed: User record not found.");
    }
  }

  async createUserWithEmailAndPassword(email, password, role, additionalData = {}) {
    const firestore = new SimulatedFirestore();
    const uid = 'usr_' + Math.random().toString(36).substr(2, 9);
    
    const newUser = {
      uid,
      email,
      role,
      fullName: additionalData.fullName || "New User",
      createdAt: new Date().toISOString(),
      ...additionalData
    };

    const targetCollection = role === 'admin' ? 'admins' : role === 'organizer' ? 'organizers' : 'users';
    await firestore.setDoc(targetCollection, uid, newUser);
    
    // Trigger automated initial notification
    await firestore.addDoc('notifications', {
      userId: uid,
      title: "Registration Success",
      message: `Welcome to SportsBharat as a ${role}. Set up your details immediately to get started.`,
      type: "system",
      read: false,
      timestamp: new Date().toISOString()
    });

    this.currentUser = newUser;
    localStorage.setItem(this.currentUserKey, JSON.stringify(newUser));
    this.notifyListeners();
    return { user: newUser };
  }

  async signOut() {
    this.currentUser = null;
    localStorage.removeItem(this.currentUserKey);
    this.notifyListeners();
    return { success: true };
  }

  notifyListeners() {
    this.authListeners.forEach(callback => callback(this.currentUser));
  }
}

// Global Exports Object
const SportsPortal = {
  db: new SimulatedFirestore(),
  auth: new SimulatedAuth(),
  isMock: true,
  analytics: {
    logEvent: (event, params) => {
      console.log(`[Firebase Analytics Log]: ${event}`, params);
    }
  },
  storage: {
    uploadBytes: async (path, file) => {
      console.log(`[Firebase Storage Mock]: Uploading file to ${path}`);
      // Simulate base64 storage URLs
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    }
  }
};

export { SportsPortal };
