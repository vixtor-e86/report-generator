// src/lib/prompts.js

export function getChapterPrompt(chapterNumber, data) {
  const { projectTitle, department, components, description, imagesContext, context } = data;

  const baseInstructions = `
You are an expert engineering consultant writing a FINAL, READY-TO-PRINT project report for a Nigerian Higher National Diploma (HND) or Degree student.
Your writing style must be: **Technical, Passive Voice, Academic, and Dense.**

**PROJECT DATA:**
- Title: ${projectTitle}
- Department: ${department}
- Key Components: ${components}
- Project Description: ${description}
- Context from previous chapters: ${context || "N/A"}
${imagesContext ? `\n- Visual Context from User Images: ${imagesContext}` : ""}

**CRITICAL RULES (READ CAREFULLY):**
1.  **NO PLACEHOLDERS:** Do NOT use brackets like [Insert Date], {Value}, or (Write here). The user CANNOT edit this.
2.  **FILL ALL DATA:** You MUST invent realistic engineering values.
    * *Bad:* "The voltage was [Insert Voltage]."
    * *Good:* "The system operates at a nominal voltage of 12V DC."
    * *Bad:* "The cost was {Amount}."
    * *Good:* "The component cost was estimated at N4,500."
3.  **NO HTML:** Use strictly Markdown (## for Main Sections, ### for Sub-sections).
4.  **CITATIONS:** Use IEEE citations [1], [2] continuously.
5.  **LENGTH:** Detailed and substantial (aim for 2000+ words/chapter).
`;

  const prompts = {
    1: `${baseInstructions}

## CHAPTER 1: INTRODUCTION
**Objective:** Set the foundation. Write 6-7 pages.

**REQUIRED STRUCTURE:**

## CHAPTER ONE: INTRODUCTION

### 1.1 Background of the Study
(Write 4 detailed paragraphs. Start broad about the global evolution of this technology, then narrow down to the African/Nigerian context. Mention specific challenges in Nigeria that make this automated solution necessary.)

### 1.2 Problem Statement
(Write 3 paragraphs. Clearly articulate the specific issues this project solves. Use phrases like "Existing systems suffer from...", "The lack of affordable solutions in Nigeria...", "Manual operation leads to errors...")

### 1.3 Aim and Objectives
**1.3.1 Aim**
(One single, concise sentence stating the goal.)

**1.3.2 Objectives**
The specific objectives of this project are:
* To design the system architecture using ${components}.
* To implement the control logic using the selected microcontroller.
* To construct a functional prototype of the ${projectTitle}.
* To evaluate the performance of the system in terms of efficiency and response time.
* To produce a cost-effective solution suitable for the Nigerian market.

### 1.4 Justification of the Study
(3 paragraphs. Technical and Economic justification. Explain why using [${components}] is better than other alternatives in terms of cost and availability in Nigeria.)

### 1.5 Significance of the Study
(2 paragraphs. Explain how this benefits: 1. The Students (educational value), 2. The Department of ${department}, and 3. The National Economy.)

### 1.6 Scope and Limitation of the Project
**Scope:**
(Define the boundaries. e.g., "The system is designed to operate within a range of 10 meters." "It utilizes a 5V power supply.")

**Limitations:**
(State realistic limitations. e.g., "The system requires a constant power supply." "It is not weatherproof." "Operation depends on network signal strength.")

### 1.7 Structure of the Project
(A brief paragraph outlining that Chapter 2 is Literature Review, Chapter 3 is Methodology, Chapter 4 is Results, and Chapter 5 is Conclusion.)
`,

    2: `${baseInstructions}

## CHAPTER 2: LITERATURE REVIEW
**Objective:** Show deep research. Write 6-8 pages. Use citations [1]-[15] heavily.

**REQUIRED STRUCTURE:**

## CHAPTER TWO: LITERATURE REVIEW

### 2.1 Introduction
(1 paragraph overview of what will be reviewed.)

### 2.2 System’s Theory of Operation
(Explain the scientific/engineering principles behind the core technology. e.g., If using a sensor, explain the physics of that sensor. If using AI, explain NLP principles. 3-4 paragraphs.)

### 2.3 Historical Background of the Project
(Trace the history from the 1960s/70s to today. Mention early inventions relevant to this project. 4 paragraphs.)

### 2.4 Modern Trends and Remarks
(What is the state-of-the-art today? Mention IoT, Industry 4.0, or AI integration. How does your project fit into this modern era?)

### 2.5 Review of Related Work
(Review 5 specific "Past Projects" or studies. I will provide the format, you provide the FICTIONAL but REALISTIC content.)
* **[1] A. Ibrahim et al. (2020):** Developed a similar system using Arduino. However, their system lacked remote monitoring capabilities, which restricted its usability to local environments only.
* **[2] O. Okeke (2021):** Proposed a method using analog sensors. While cost-effective, the accuracy was low (approx 75%), leading to frequent calibration errors.
* **[3] J. Smith (2019):** Worked on a GSM-based variant. The major limitation was the high power consumption, which drained the battery in under 4 hours.
* (Generate 2 more realistic reviews relevant to ${components}.)

### 2.6 Summary of Literature Review
(Summarize the gaps found in the review above and explain how your project fills these gaps using modern components like [${components}].)
`,

    3: `${baseInstructions}

## CHAPTER 3: METHODOLOGY AND IMPLEMENTATION
**Objective:** The technical "How-To". This must be very detailed.

**REQUIRED STRUCTURE:**

## CHAPTER THREE: METHODOLOGY AND IMPLEMENTATION

### 3.1 Introduction
(Brief overview of the design approach.)

### 3.2 Data Collection and Material
(Explain that primary data was obtained through prototyping and secondary data from datasheets.)

### 3.3 Implementation Analysis
**3.3.1 Description of the System’s Block Diagram**
(Describe the flow of signals from Input -> Process -> Output. Mention specific components from the list: ${components}.)

**3.3.2 Description of System Circuit Diagram**
(Explain the electrical connections. "The power supply connects to the VCC of the microcontroller. The signal pin is connected to the appropriate GPIO...")

### 3.4 System Design and Component Analysis
(For EACH component in this list: [${components}], write a dedicated subsection. You MUST invent specs. e.g., "The resistor is 10kOhm", "The capacitor is 100uF".)

### 3.5 System Verification
**3.5.1 Hardware Simulation (Breadboarding)**
(Describe testing the circuit on a breadboard. Mention using a multimeter to verify the 5V and 3.3V rails.)
**3.5.2 Software/Firmware Testing**
(Describe writing the code, compiling, and uploading it to the microcontroller.)

### 3.6 Soldering and Assembly Procedure
(Step-by-step physical construction. "Components were arranged on a Vero-board to minimize space... Soldering was done using 60/40 lead-tin rosin core solder... Continuity tests were performed using a digital multimeter...")

### 3.7 System Operational Guide
(How does a user use it? Step 1: Power on via the switch. Step 2: Observe the initialization LED. Step 3: Trigger the input...)

### 3.8 Bill of Engineering Measurement and Evaluation (BEME)
(Create a Markdown Table. You MUST fill the 'Amount' column with realistic Naira prices. Do NOT leave blanks.)

| S/N | Description | Quantity | Rate (N) | Amount (N) |
|---|---|---|---|---|
| 1 | Microcontroller Module | 1 | 8,500 | 8,500 |
| 2 | Power Supply Unit | 1 | 4,000 | 4,000 |
| 3 | Sensors and Peripherals | 2 | 2,500 | 5,000 |
| 4 | Vero Board & Soldering Kit | 1 | 3,000 | 3,000 |
| 5 | Casing and Packaging | 1 | 5,000 | 5,000 |
| 6 | Miscellaneous (Wires, Screws) | 1 | 2,000 | 2,000 |
| **Total** | | | | **27,500** |
*(Adjust these items and prices to match the specific components: ${components})*
`,

    4: `${baseInstructions}

## CHAPTER 4: TEST AND RESULT ANALYSIS
**Objective:** Prove it works. Use Tables with FILLED DATA.

**REQUIRED STRUCTURE:**

## CHAPTER FOUR: TEST AND RESULT ANALYSIS

### 4.1 Introduction
(Overview of the testing phase.)

### 4.2 Tests Conducted
**4.2.1 Unit Testing**
(Testing individual components like checking the battery voltage outputs 12V.)
**4.2.2 System Integration Testing**
(Testing the whole system together to ensure modules communicate correctly.)

### 4.3 Results
(Present realistic data. Do not use placeholders.)

**Table 4.1: Power Supply Voltage Test**
| Component | Expected Voltage (V) | Measured Voltage (V) | Status |
|---|---|---|---|
| Input Source | 220V AC | 224V AC | Normal |
| Transformer Output | 12V AC | 12.3V AC | Normal |
| Rectifier Output | 12V DC | 11.8V DC | Normal |
| Regulator Output | 5V DC | 5.02V DC | **Pass** |

**Table 4.2: System Response Test**
| Trial Number | Input Condition | Response Time (s) | System Action |
|---|---|---|---|
| 1 | Signal Applied | 1.2s | Triggered |
| 2 | Signal Applied | 1.1s | Triggered |
| 3 | Signal Applied | 1.3s | Triggered |
| 4 | No Signal | N/A | Idle |

### 4.4 Discussion of Results
(Analyze the tables above. "As seen in Table 4.1, the voltage regulation was stable with a deviation of only 0.02V. Table 4.2 shows an average response time of 1.2 seconds, which falls within the acceptable range for this type of system...")
`,

    5: `${baseInstructions}

## CHAPTER 5: CONCLUSION AND RECOMMENDATIONS
**Objective:** Wrap up professionally.

**REQUIRED STRUCTURE:**

## CHAPTER FIVE: CONCLUSION AND RECOMMENDATIONS

### 5.1 Introduction
(Recap the project journey.)

### 5.2 Summary of Findings
(Summarize the achievements. "The system successfully demonstrated [Main Function] with an efficiency of approximately 95%.")

### 5.3 Project Appraisal
(Critical look at the work. "The project successfully met the main objective of [Aim]. All subsystems functioned as designed.")

### 5.4 Problems Encountered
1.  **Component Availability:** Sourcing specific sensors was difficult in the local market, requiring substitution.
2.  **Power Instability:** Initial tests showed fluctuations which were solved by adding decoupling capacitors.
3.  **Calibration:** Fine-tuning the sensor sensitivity took several iterations.

### 5.5 Areas of Application
* Home Automation Systems
* Industrial Control Rooms
* Educational Laboratories
* Small Scale Manufacturing Enterprises

### 5.6 Conclusion
(Final concluding statement. "In conclusion, the ${projectTitle} is a viable solution that addresses the identified problems...")

### 5.7 Recommendations
1.  **Integration of IoT:** Future iterations should include a Wi-Fi module for remote data logging.
2.  **Battery Optimization:** Using a Lithium-Polymer battery would extend the operational time.
3.  **PCB Manufacturing:** Moving from Vero-board to a printed circuit board (PCB) would improve durability.

## REFERENCES
(List 10-15 high-quality IEEE citations. Use specific names. Do NOT use placeholders.)
[1] A. B. Adebayo, "Modern Trends in Engineering," *Journal of Nigerian Engineering*, vol. 4, no. 2, pp. 45-50, 2023.
[2] C. D. John and E. F. Peters, "Microcontroller Applications in Automation," *IEEE Transactions on Industrial Electronics*, vol. 12, pp. 112-118, 2022.
[3] (Generate 10 more realistic citations relevant to ${components})
`
  };

  return prompts[chapterNumber] || prompts[1];
}