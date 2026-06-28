# 🏛️ National Sports Management & Competition Portal — SportsBharat

SportsBharat is a premium, government-grade responsive web portal built for the **Ministry of Youth Affairs & Sports (Government of India)** to digitize athletic championships, verify regional organizers, track attendance via cryptographic secure scanners, and issue validated digital merit credentials.

---

## ⚡ Quick Start: Run Locally

### 1. Pre-requisites
Make sure you have [Node.js (LTS Version)](https://nodejs.org) installed on your system.

### 2. Live Dev Server
Open your terminal in the workspace directory `e:\Sports web` and run:

```bash
# 1. Install dependencies (Vite)
npm install

# 2. Start the local server
npm run dev
```

The terminal will print a local URL (usually `http://localhost:5173/`). Open this link in your web browser to immediately access the portal.

---

## 👥 Setup Mock Credentials for Direct Testing
The portal is equipped with a high-fidelity client simulation engine. If actual Firebase Keys are missing or mocked, the database automatically boots an in-memory & `localStorage` Firestore layer. You can log in immediately using these pre-seeded government credentials with **any password**:

*   **Athlete User Account**:
    *   **Email**: `athlete@sports.gov.in`
    *   **Password**: *Any password*
*   **Regional Sports Organizer**:
    *   **Email**: `organizer@sports.gov.in`
    *   **Password**: *Any password*
*   **National System Administrator**:
    *   **Email**: `admin@sports.gov.in`
    *   **Password**: *Any password*

---

## 🔒 Firebase Real Services Setup & Deployment

When you are ready to shift from the simulated local layer to live Google Firebase Cloud Services, follow these setup steps:

### 1. Initialize Firebase Project
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and name it `SportsBharat`.
3. Enable **Google Analytics** for detailed system growth dashboards.
4. Add a **Web App** integration under project settings, and copy your config object.
5. Open the configuration file [firebase-config.js](file:///e:/Sports%20web/js/firebase-config.js) and paste your configuration into the `firebaseConfig` block.

---

### 2. Configure Firebase Security Rules

#### 📑 Firestore Security Rules
Go to **Firestore Database** ➔ **Rules** tab, and publish the following policy to secure athlete records:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Allow user settings records
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && request.auth.token.role == 'admin';
    }

    // Competitions rules
    match /competitions/{compId} {
      allow read: if true; // Public access for athletes to search matches
      allow create, update: if request.auth != null && 
        (request.auth.token.role == 'organizer' || request.auth.token.role == 'admin');
      allow delete: if request.auth != null && request.auth.token.role == 'admin';
    }

    // Registrations rules
    match /registrations/{regId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.token.role == 'organizer' || 
         request.auth.token.role == 'admin');
      allow update: if request.auth != null && 
        (request.auth.token.role == 'organizer' || request.auth.token.role == 'admin');
    }

    // Organizer licenses profiles
    match /organizers/{orgId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == orgId;
      allow update: if request.auth != null && request.auth.token.role == 'admin';
    }
  }
}
```

---

#### 🗂️ Firebase Cloud Storage Security Rules
Go to **Storage** ➔ **Rules** tab, and publish the following rules to secure avatar pictures and banners:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Athlete profiles folder
    match /avatars/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Organizers tournament banner folders
    match /banners/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.role == 'organizer';
    }

    // Press release covers folder
    match /news/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.role == 'organizer';
    }
  }
}
```

---

### 🚀 Deploying to Firebase Hosting

To host the portal live on a high-speed `.web.app` subdomain for free, run these commands inside your workspace:

```bash
# 1. Install Firebase Command Line Interface
npm install -g firebase-tools

# 2. Authenticate Google Account
firebase login

# 3. Initialize Hosting config
firebase init hosting
# Select your project, set directory to ".", configure as a single-page app: No.

# 4. Deploy live!
firebase deploy --only hosting
```

Your government portal is now online, fully functional, and scalable! 🏛️
