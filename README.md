#  AI-Powered Adaptive Study Planner (HACKATHON PROJECT)

A smart, prototype-level scheduling application designed to help engineering students manage high cognitive loads, balance subject credits, and adapt to changing confidence levels in real-time.

---

## 🔗 Official Submission Links
* **GitHub Repository:** https://github.com/Gauritiwari22/AI-Study-Planner
* **Live Demo:** https://gauritiwari22.github.io/AI-Study-Planner/
* **Demo Video (Google Drive):** https://drive.google.com/file/d/14AzDEWeHbPuUxS8i2ClY9KUjTC-L3bZ5/view?usp=drive_link

---

## 🌟 The Problem & Solution
Engineering students often face "Cramming Culture" due to disorganized schedules and complex subject dependencies. 
**Our Solution:** An intelligent planner that doesn't just list tasks but calculates **priority weights** based on academic credits and student confidence.

## ✨ Key Features
* **Adaptive Weighting Algorithm:** Automatically allocates more study hours to high-credit subjects (e.g., Data Structures) vs. low-credit electives.
* **Cognitive Load Color-Coding:** Uses a visual system to balance mental energy:
    * 🟢 **Green:** Deep Learning (New Topics).
    * 🟣 **Purple:** Practice/Problem Solving.
    * 🔘 **Grey:** Buffer Time (for unpredictable engineering workloads).
* **Real-time Progress Adaptation:** Users can adjust a "Confidence Slider." If confidence increases, the system dynamically re-allocates time to other priority areas.
* **Prerequisite Gap Alerts:** Identifies foundational subjects that must be mastered before tackling advanced engineering topics.

## 🛠️ Technical Execution
* **Architecture:** Built using a clean separation of concerns with Vanilla JavaScript, HTML5, and CSS3.
* **Responsive UI:** Uses CSS Flexbox and Grid to ensure the planner is accessible on both mobile and desktop.
* **Persistence:** Uses `localStorage` to ensure the student's data and plan remain intact even after a page refresh.

## 🚀 How to Run the Prototype
1.  Visit the **Live Demo** link provided above.
2.  Enter your Subject Name, Credits (1-5), and current Confidence Level.
3.  Click **"Generate Study Plan"** to see your color-coded weekly schedule.
4.  Adjust the **Confidence Slider** in the Progress section to see the adaptive re-allocation in action.

---
Developed for the **UnsaidTalks Hackathon** | February 2026
