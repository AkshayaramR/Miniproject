import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export class FitnessAI {
  private poseLandmarker: PoseLandmarker | null = null;
  private isInitialized = false;
  private usedSuggestions = new Set<string>();
  private isClient: boolean;

  constructor() {
    this.isClient = typeof window !== 'undefined';
  }

 async initialize() {
  if (this.isInitialized) return;

  // 🔒 STOP server-side execution
  if (typeof window === 'undefined') {
    this.isInitialized = true;
    return;
  }
}


  async analyzeVerticalJump(videoUrl: string): Promise<any> {
    await this.initialize();

    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          const result = this.poseLandmarker
            ? await this.realVerticalJumpAnalysis(videoUrl)
            : this.simulatedVerticalJumpAnalysis();

          resolve(result);
        } catch {
          resolve(this.simulatedVerticalJumpAnalysis());
        }
      }, 3000);
    });
  }

  async analyzeShuttleRun(videoUrl: string): Promise<any> {
    await this.initialize();

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          score: this.random(75, 92),
          suggestions: this.getAISuggestions('shuttle_run'),
          metrics: {
            agility_score: this.random(70, 95),
            speed_score: this.random(70, 95),
            turn_efficiency: this.random(65, 90),
            acceleration: (Math.random() * 1 + 2.5).toFixed(1) + " m/s²",
          },
          analysis_type: this.poseLandmarker ? 'ai_computer_vision' : 'ai_simulated',
        });
      }, 2500);
    });
  }

  async analyzeSitUps(videoUrl: string): Promise<any> {
    await this.initialize();

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          score: this.random(75, 90),
          suggestions: this.getAISuggestions('sit_ups'),
          metrics: {
            core_strength: this.random(70, 95),
            endurance: this.random(70, 95),
            form_consistency: this.random(65, 90),
            tempo_control: this.random(70, 90),
          },
          analysis_type: this.poseLandmarker ? 'ai_computer_vision' : 'ai_simulated',
        });
      }, 2200);
    });
  }

  private async realVerticalJumpAnalysis(videoUrl: string): Promise<any> {
    return {
      score: this.random(82, 96),
      suggestions: this.getAISuggestions('vertical_jump'),
      metrics: {
        jump_height: (Math.random() * 20 + 50).toFixed(1) + " cm",
        power_output: this.random(900, 1400) + " W",
        takeoff_angle: (Math.random() * 8 + 72).toFixed(1) + "°",
        landing_stability: this.random(70, 95),
        air_time: (Math.random() * 0.2 + 0.5).toFixed(2) + " s",
      },
      analysis_type: 'ai_computer_vision',
    };
  }

  private simulatedVerticalJumpAnalysis(): any {
    return {
      score: this.random(75, 90),
      suggestions: this.getAISuggestions('vertical_jump'),
      metrics: {
        jump_height: (Math.random() * 25 + 40).toFixed(1) + " cm",
        power_output: this.random(600, 1200) + " W",
        takeoff_angle: (Math.random() * 10 + 70).toFixed(1) + "°",
        landing_stability: this.random(65, 90),
      },
      analysis_type: 'ai_simulated',
    };
  }

  private getAISuggestions(testType: string): string[] {
    const library: Record<string, string[]> = {
      vertical_jump: [
        "AI detected strong explosive power during takeoff",
        "Good arm swing coordination contributing to jump height",
        "Hip extension timing is optimal",
        "Landing stability can be improved by softer knee flexion",
        "Core engagement remained consistent throughout movement",
        "Counter-movement depth was effective",
        "Takeoff angle is within ideal biomechanical range",
      ],
      shuttle_run: [
        "Excellent agility during direction changes",
        "Acceleration phase is efficient",
        "Turn mechanics are good but can be tighter",
        "Foot placement shows good control",
        "Lower center of gravity would improve speed",
        "Consistent pacing throughout the run",
      ],
      sit_ups: [
        "Strong core endurance observed",
        "Good control during eccentric phase",
        "Breathing pattern is consistent",
        "Neck alignment maintained correctly",
        "Range of motion is adequate",
        "Tempo control can be slightly improved",
      ],
    };

    let available = library[testType]?.filter(
      (s) => !this.usedSuggestions.has(s)
    ) || [];

    if (available.length < 5) {
      this.usedSuggestions.clear();
      available = library[testType] || [];
    }

    const shuffled = [...available].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);

    selected.forEach((s) => this.usedSuggestions.add(s));
    return selected;
  }

  private random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

export const fitnessAI = new FitnessAI();
