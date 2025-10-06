import React, { useEffect, useState } from "react";
import EmergencyMap from "./EmergencyMap";
import EmergencyModal from "./EmergencyModal";
import { connectWS, addMessageHandler, removeMessageHandler } from "../services/wsService";
import "./Dashboard.css";

export default function Dashboard() {
  const [emergencies, setEmergencies] = useState([]);
  const [normalTasks, setNormalTasks] = useState([]);
  const [selected, setSelected] = useState(null);

  // Get user's state from localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const userState = user?.user?.state;
  console.log(userState);

  // Clean up old emergencies (older than 1 hour) every 5 minutes
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setEmergencies((prev) => {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return prev.filter(emergency => {
          const emergencyTime = new Date(emergency.createdAt);
          return emergencyTime > oneHourAgo;
        });
      });
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(cleanupInterval);
  }, []);

  // Fetch normal tasks on mount
  useEffect(() => {
    const fetchNormalTasks = async () => {
      try {
        const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";
        const response = await fetch(`${API}/api/normal?limit=50`);
        if (response.ok) {
          const data = await response.json();
          setNormalTasks(data.tasks || []);
        }
      } catch (error) {
        console.error("Error fetching normal tasks:", error);
      }
    };

    fetchNormalTasks();
    // Refresh normal tasks every 30 seconds
    const interval = setInterval(fetchNormalTasks, 30000);
    return () => clearInterval(interval);
  }, []);
console.log(normalTasks);
console.log(emergencies);
  // Handle status updates from WebSocket
  useEffect(() => {
    const handleStatusUpdate = (data) => {
      console.log("📡 Emergencies component received status update:", data);
      
      // Check if this is an emergency or normal task update
      if (data.type === "emergency" || !data.type) {
        setEmergencies(prev => 
          prev.map(item => 
            item.id === data.id ? { ...item, status: data.status } : item
          )
        );
      } else if (data.type === "Resource Allocation") {
        setNormalTasks(prev => 
          prev.map(item => 
            item.id === data.id ? { ...item, status: data.status } : item
          )
        );
      }
    };
    
    // Register the status update handler
    addMessageHandler("statusUpdate", handleStatusUpdate);
    
    return () => {
      // Clean up the handler when component unmounts
      removeMessageHandler("statusUpdate");
    };
  }, []);

  useEffect(() => {
    connectWS((data) => {
      console.log("WebSocket message received in Emergencies:", data);
      if (data.type === "emergency") {
        setEmergencies((prev) => {
          // Check if emergency already exists by ID to prevent duplicates
          const exists = prev.some(emergency => emergency.mobileNumber === data.mobileNumber);
          if (exists) {
            console.log("Emergency already exists, skipping duplicate:", data.id);
            return prev;
          }
          console.log("Adding new emergency:", data.id);
          return [...prev, data];
        });
      } else if (data.type === "Resource Allocation") {
        setNormalTasks((prev) => {
          // Check if normal task already exists by ID to prevent duplicates
          const exists = prev.some(task => task.id === data.id);
          if (exists) {
            console.log("Normal task already exists, skipping duplicate:", data.id);
            return prev;
          }
          console.log("Adding new resource allocation:", data.id);
          return [...prev, data];
        });
      }
    });
  }, []);

  // Combine emergencies and normal tasks for display
  const allItems = [
    // Filter emergencies by user state
    ...emergencies,
  
    // Filter normal tasks by user state
    ...normalTasks
      .filter((task) => !userState || task.location?.state === userState)
      .map((task) => ({
        ...task,
        // Convert normal task location to emergency format for map display
        location: {
          coordinates: task.location?.coordinates || [0, 0],
          address: task.location?.address,
        },
        address: task.location?.address || "Unknown Address",
        mobileNumber: task.meta?.contactPhone,
        email: task.meta?.contactEmail,
        // Add resource allocation specific details
        resourceType: task.meta?.resourceType,
        quantity: task.meta?.quantity,
        urgency: task.meta?.urgency,
        description: task.meta?.description,
        contactName: task.meta?.contactName,
      })),
  ];

  // Debug log to track item count
  console.log(`Total emergencies: ${emergencies.length}, Normal tasks: ${normalTasks.length}, Combined: ${allItems.length}`);

  return (
    <div className="dashboard-container">
      <EmergencyMap
        emergencies={allItems}
        onMarkerClick={(data) => setSelected(data)}
      />
      {selected && (
        <EmergencyModal data={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
