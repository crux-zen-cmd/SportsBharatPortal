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
  appId: "1:634844615752:web:c435fb81bcc75377d0747d"
};

// Check if we are running in real Firebase environment or using the simulator
const IS_REAL_FIREBASE = false; // Toggle to true to connect to real Firebase credentials

let firebaseInstance = null;
let db = null;
let auth = null;
let storage = null;
let analytics = null;
let messaging = null;

import { VERIFIED_INDIAN_COMPETITIONS } from './live-competitions-service.js';
import { getEventRelatedPhoto } from './image-fallback.js';

// Initialize Simulated/Mock Database for immediate client-side testing
class SimulatedFirestore {
  constructor() {
    this.storageKey = 'sports_portal_db_v4';
    this.listeners = {};
    if (!localStorage.getItem(this.storageKey)) {
      this.seedDummyData();
    } else {
      this.ensureDataIntegrity();
    }
  }

  ensureDataIntegrity() {
    try {
      const data = this.getData();
      if (!data) {
        this.seedDummyData();
        return;
      }
      let modified = false;
      if (!data.competitions || Object.keys(data.competitions).length === 0) {
        data.competitions = {};
        if (Array.isArray(VERIFIED_INDIAN_COMPETITIONS)) {
          VERIFIED_INDIAN_COMPETITIONS.forEach(c => {
            const photo = c.thumbnail || c.bannerUrl || (typeof getEventRelatedPhoto === 'function' ? getEventRelatedPhoto(c.sportType, c.title) : '');
            data.competitions[c.id] = { ...c, thumbnail: photo, bannerUrl: photo };
          });
          modified = true;
        }
      } else {
        Object.values(data.competitions).forEach(c => {
          if (!c.thumbnail || !c.bannerUrl) {
            const photo = c.thumbnail || c.bannerUrl || (typeof getEventRelatedPhoto === 'function' ? getEventRelatedPhoto(c.sportType, c.title) : '');
            if (photo) {
              c.thumbnail = c.thumbnail || photo;
              c.bannerUrl = c.bannerUrl || photo;
              modified = true;
            }
          }
        });
      }
      if (!data.registrations || Object.keys(data.registrations).length === 0) {
        data.registrations = this.getSeedRegistrations();
        modified = true;
      }
      if (modified) {
        this.saveData(data);
      }
    } catch (e) {
      console.warn('[SimulatedFirestore] ensureDataIntegrity failed:', e);
    }
  }

  getSeedRegistrations() {
    return {
      "reg_demo_1": {
        id: "reg_demo_1",
        competitionId: "live_bengaluru_open_athletics_2026",
        competitionTitle: "Bengaluru Open National Athletics Championship",
        sportType: "Athletics",
        dateTime: "2026-07-20T07:00",
        userId: "user_demo",
        userName: "Rajesh Kumar",
        regType: "Athlete / Player",
        idProof: "1234 5678 9012",
        status: "approved",
        attended: true,
        timestamp: "2026-05-10T10:00:00.000Z"
      },
      "reg_demo_2": {
        id: "reg_demo_2",
        competitionId: "live_national_cricket_trophy_2026",
        competitionTitle: "All India Inter-State T20 Cricket Championship 2026",
        sportType: "Cricket",
        dateTime: "2026-10-05T09:30",
        userId: "user_demo",
        userName: "Rajesh Kumar",
        regType: "Athlete / Player",
        idProof: "1234 5678 9012",
        status: "pending",
        attended: false,
        timestamp: "2026-05-18T14:30:00.000Z"
      }
    };
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
          badges: ["🏛️ First Registration", "🏅 Grassroots Contender"],
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
      competitions: (() => {
        const comps = {};
        if (Array.isArray(VERIFIED_INDIAN_COMPETITIONS)) {
          VERIFIED_INDIAN_COMPETITIONS.forEach(c => { comps[c.id] = c; });
        }
        return comps;
      })(),
      squads: [
        {
          id: "squad_1",
          authorName: "Rahul Verma",
          authorRole: "Team Captain • Fast Bowler",
          authorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=60",
          roleNeeded: "Express Pace Bowler (130+ km/h)",
          sport: "Cricket",
          tourneyTarget: "National Grassroots U-19 Cup",
          city: "Bangalore, Karnataka",
          contactPhone: "+91 98450 12345",
          message: "We need an opening strike bowler who can bowl tight spells with the new ball at Chinnaswamy.",
          postedAt: "2 hours ago"
        },
        {
          id: "squad_2",
          authorName: "Debashish Roy",
          authorRole: "Midfield Playmaker",
          authorAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=60",
          roleNeeded: "Centre-Back & Sweeper",
          sport: "Football",
          tourneyTarget: "135th Durand Cup Open Qualifier",
          city: "Kolkata, West Bengal",
          contactPhone: "+91 98300 67890",
          message: "Forming a squad of collegiate footballers for the Durand Cup open club qualification bracket.",
          postedAt: "5 hours ago"
        },
        {
          id: "squad_3",
          authorName: "Amit Hooda",
          authorRole: "Main Raider",
          authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60",
          roleNeeded: "Right Corner Specialist & Ankle Holder",
          sport: "Kabaddi",
          tourneyTarget: "Bharat Kabaddi Pro League - Delhi",
          city: "Rohtak / Delhi NCR",
          contactPhone: "+91 94160 55443",
          message: "Solid 7-man team searching for an experienced right corner to stop bonus raids.",
          postedAt: "1 day ago"
        },
        {
          id: "squad_4",
          authorName: "Ananya Reddy",
          authorRole: "State Ranked Singles Player",
          authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=60",
          roleNeeded: "Mixed Doubles Partner (BWF/BAI)",
          sport: "Badminton",
          tourneyTarget: "BWF Syed Modi International",
          city: "Hyderabad, Telangana",
          contactPhone: "+91 99890 11223",
          message: "Looking for an aggressive front-court partner for the upcoming national mixed doubles trials.",
          postedAt: "1 day ago"
        }
      ],
      quizzes: [
        {
          id: "quiz_cricket_laws",
          title: "BCCI & MCC Laws of Cricket IQ",
          category: "Cricket Rules",
          duration: "5 Mins • 10 Qs",
          desc: "Test your mastery over LBW criteria, DRS protocols, Dead Ball rules, and boundary countbacks.",
          perks: ["🏅 Official Digital Badge", "⚡ 100 Talent XP Points"],
          questions: [
            {
              q: "Under MCC Law 36, which condition must be met for an LBW dismissal when the batsman attempts a stroke?",
              options: [
                "Ball must pitch outside leg stump",
                "Ball must impact in line with stumps or pitch in line",
                "Impact can be outside off stump even if batsman offers a stroke",
                "The bowler must appeal before the ball touches the pitch"
              ],
              correct: 1
            },
            {
              q: "How many fielders are permitted outside the 30-yard fielding ring during the Powerplay overs in T20I cricket?",
              options: ["Max 3 fielders", "Max 2 fielders", "Max 4 fielders", "No fielders"],
              correct: 1
            },
            {
              q: "What is the official penalty run award given to the batting team if a fielding helmet placed on ground is hit by the ball?",
              options: ["3 Penalty Runs", "5 Penalty Runs", "4 Penalty Runs", "Dead ball with no penalty"],
              correct: 1
            }
          ]
        },
        {
          id: "quiz_football_tactics",
          title: "FIFA Football Tactics & VAR Rules",
          category: "Football",
          duration: "4 Mins • 8 Qs",
          desc: "Analyze offside phases, inverted fullback tactics, high-press pressing triggers, and VAR intervention thresholds.",
          perks: ["⭐ Pro Tactical Badge", "⚡ 80 Talent XP Points"],
          questions: [
            {
              q: "Can a player be caught offside directly from a throw-in, goal kick, or corner kick?",
              options: [
                "Yes, offside applies to all set pieces",
                "No, offside offense cannot occur directly from these three restarts",
                "Only if the player is in the 6-yard box",
                "Only in international matches"
              ],
              correct: 1
            },
            {
              q: "Under modern IFAB laws, for which 4 match-changing scenarios can VAR intervene?",
              options: [
                "Goals, Penalty decisions, Direct Red Cards, Mistaken Identity",
                "Free kicks, Corners, Yellow cards, Throw-ins",
                "Offside inside center circle, Substitutions, Ball out of bounds",
                "Handball outside the penalty box only"
              ],
              correct: 0
            }
          ]
        },
        {
          id: "quiz_kabaddi_rules",
          title: "Pro Kabaddi Rules & Strategic IQ",
          category: "Kabaddi",
          duration: "4 Mins • 8 Qs",
          desc: "Master Super Tackle point calculations, Do-or-Die raid sequences, Lobby rules, and Bonus line criteria.",
          perks: ["💪 Kabaddi Expert Badge", "⚡ 80 Talent XP Points"],
          questions: [
            {
              q: "How many points does a defending team earn for executing a successful 'Super Tackle' in Pro Kabaddi?",
              options: ["1 Point", "2 Points", "3 Points", "4 Points"],
              correct: 1
            },
            {
              q: "A raider must have a minimum of how many defending players on the mat to be eligible to score a Bonus point?",
              options: ["5 or more defenders", "6 or 7 defenders", "At least 4 defenders", "Any number of defenders"],
              correct: 1
            }
          ]
        }
      ],
      registrations: this.getSeedRegistrations(),
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
    if (Array.isArray(col)) {
      return col.map((item, idx) => ({
        id: item.id || `item_${idx}`,
        ...item,
        data: () => item
      }));
    }
    return Object.keys(col).map(key => ({
      id: key,
      ...col[key],
      data: () => col[key]
    }));
  }

  async setDoc(collection, docId, docData) {
    const data = this.getData();
    if (!data[collection]) data[collection] = {};
    if (Array.isArray(data[collection])) {
      const idx = data[collection].findIndex(item => item.id === docId);
      if (idx >= 0) {
        data[collection][idx] = { ...data[collection][idx], ...docData, id: docId };
      } else {
        data[collection].push({ ...docData, id: docId });
      }
    } else {
      data[collection][docId] = { ...data[collection][docId], ...docData, id: docId };
    }
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
      const match = Object.values(collection).find(u => u.email.toLowerCase() === email.toLowerCase());
      if (match) {
        foundUser = match;
        break;
      }
    }

    if (foundUser) {
      // If the user has a password set (either registered or demo), check it
      const expectedPassword = foundUser.password || 'sports123'; // Default password for pre-seeded demo accounts
      if (expectedPassword !== password) {
        throw new Error("Authentication failed: Incorrect password.");
      }

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
    const data = firestore.getData();

    // Check if user already exists
    for (let r of ['users', 'organizers', 'admins']) {
      const collection = data[r] || {};
      const match = Object.values(collection).find(u => u.email.toLowerCase() === email.toLowerCase());
      if (match) {
        throw new Error("Registration failed: Email is already registered.");
      }
    }

    const uid = 'usr_' + Math.random().toString(36).substr(2, 9);

    const newUser = {
      uid,
      email,
      password, // Store password for authentic login
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
