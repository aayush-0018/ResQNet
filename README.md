
# ResQNet — Community Emergency & Disaster Management Platform

---

## 🌐 Live Deployments

| Service | Description | URL |
|----------|--------------|-----|
| 🧠 **Server** | REST API and core backend logic | [https://resqnet-server.onrender.com](https://resqnet-server.onrender.com) |
| ⚙️ **Worker** | WebSocket + Redis-based worker layer | [https://resqnet-2-ighs.onrender.com](https://resqnet-2-ighs.onrender.com) |
| 💻 **Client** | Frontend interface (React/Vite) | [https://resqnet-0.onrender.com](https://resqnet-0.onrender.com) |

> 🧭 **Start with the Client URL** —  
> 👉 [**https://resqnet-0.onrender.com**](https://resqnet-0.onrender.com)  
> This is the main interface of the platform, internally connected to the Server and Worker layers.

---

## 🚀 Overview

ResQNet is a **real-time emergency and disaster management platform** designed to **save lives and enhance operational efficiency** during crisis situations. It streamlines communication between **victims**, **volunteers**, and **NDRF (National Disaster Response Force)** teams through intelligent task distribution, live alerts, and multi-worker backend processing.

---

## 🌍 Purpose
Disaster management often suffers from fragmented coordination and delayed response times. ResQNet addresses this challenge by providing an integrated platform that connects **rescue teams, victims, and support networks** in real-time.

---

## 🧠 Core Features
- ⚡ **SOS Emergency Handling:** Victims can raise SOS alerts instantly, which are prioritized and routed to nearby NDRF teams.
- 🧵 **Multi-Worker Backend:** A scalable backend powered by **Redis**, **Messaging Queues**, and **WebSockets** to handle asynchronous tasks such as:
  - Resource allocation  
  - Team notifications  
  - Real-time status updates  
  - Alert broadcasting  
- 📡 **Pub/Sub Event System:** Ensures minimal latency for real-time communication between connected clients and workers.
- 🔔 **Subscription-Based Alert System:** Contributors can subscribe to specific NDRF teams and receive **real-time broadcast notifications** about active rescue operations or emergencies.
- 🧩 **Modular Architecture:** Built with separation of concerns — independent **Server**, **Worker**, and **Client** services for better scalability and maintainability.

---

## 🏗️ Architecture Flow

You can view the full system architecture here:  
👉 [**Architecture Flowchart**](https://drive.google.com/file/d/1BeUZKotzJV-82lHw_J0-7-bsVogb2iSF/view)

**Tech Stack:**
- **Frontend:** React.js, Vite, WebSockets  
- **Backend:** Node.js, Express.js, MongoDB  
- **Worker Layer:** Redis, Pub/Sub, WebSockets  
- **Deployment:** Render Cloud

---

## 🧩 Project Structure


