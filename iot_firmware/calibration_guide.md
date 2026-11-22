# IoT Sensor Calibration & Conversion Guide

This guide details the mathematical equations, calibration factors, and software filter implementations used to transform raw electrical pulses and ADC voltages into precise hydraulic parameters (Litres/Minute, Bar/PSI, and Tank Percentage).

---

## 1. Water Flow Sensor (YF-S201) Calibration

The YF-S201 contains a pinwheel turbine with an embedded magnet and a Hall effect sensor. For every rotation, 6 electrical pulses are generated.

### Mathematical Formulation
The factory relationship between output pulse frequency $f$ (in Hertz) and flow rate $Q$ (in Litres per Minute) is:
$$f = 7.5 \times Q$$

Solving for flow rate $Q$:
$$Q (\text{L/min}) = \frac{f}{7.5} = \frac{\text{Pulses in interval } \Delta t}{\Delta t (\text{seconds}) \times 7.5}$$

### Accumulated Volume Integration
To calculate the total consumption in litres:
$$V_{\text{total}} = \sum \left( \frac{Q_i}{60} \times \Delta t_i \right)$$

### Practical Calibration Step
Due to pipe turbulence, viscosity, and manufacturing variance, calculate empirical factor $K$:
1. Fill a calibrated 10-liter bucket.
2. Count total pulses recorded: $N_{\text{pulses}}$.
3. Revised $K = \frac{N_{\text{pulses}}}{10 \times 60}$.

---

## 2. Pressure Transducer Calibration (0-1.2 MPa / 0-12 Bar)

The pressure sensor produces a linear DC voltage output:
- $V_{\text{min}} = 0.5\text{ V}$ at $0\text{ Bar}$ (gauge)
- $V_{\text{max}} = 4.5\text{ V}$ at $12\text{ Bar}$ (or $10\text{ Bar}$ depending on selected model)

### Conversion Formula
After accounting for the 1.5x scaling of the resistive voltage divider:
$$P (\text{Bar}) = \left( \frac{V_{\text{measured}} - 0.50}{4.50 - 0.50} \right) \times P_{\text{max}}$$

### Unit Conversions
- $1\text{ Bar} = 14.5038\text{ PSI}$
- $1\text{ Bar} = 100\text{ kPa} = 0.1\text{ MPa}$

---

## 3. Ultrasonic Water Level Sensor (HC-SR04 / JSN-SR04T)

The ultrasonic transmitter emits an 8-cycle 40 kHz burst upon receiving a 10 $\mu\text{s}$ trigger pulse. The echo pin remains HIGH for the round-trip duration $t_{\text{echo}}$.

### Distance to Liquid Surface
$$d (\text{cm}) = \frac{t_{\text{echo}} (\mu\text{s}) \times 0.0343 \text{ cm}/\mu\text{s}}{2}$$

### Tank Volume & Percentage
For a tank of total height $H_{\text{total}}$ and surface offset $d_{\text{min}}$ (sensor dead zone, typically 20 cm):
$$\text{Water Depth } h = H_{\text{total}} - d$$
$$\text{Level Percentage } (\%) = \left( \frac{h}{H_{\text{total}}} \right) \times 100\%$$
$$\text{Current Volume (L)} = V_{\text{capacity}} \times \left( \frac{\text{Level Percentage}}{100} \right)$$

---

## 4. Software Filtering & Noise Rejection

To prevent false alarms caused by electrical noise or water sloshing:
- **Exponential Moving Average (EMA):**
  $$y_t = \alpha \cdot x_t + (1 - \alpha) \cdot y_{t-1} \quad (\alpha = 0.25)$$
- **Outlier Rejection Window:** Any instantaneous reading varying by $> 50\%$ from the 5-sample median is rejected before entering the Leakage Detection Engine.
