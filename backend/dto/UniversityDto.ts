export interface UniversityDto {
  summary: string;
  university_name: string;
  location: {
    city: string;
    state_province: string;
    country: string;
  };
  basic_info: {
    established_year: string;
    student_population: string;
    acceptance_rate: string;
    ranking_global: string;
    website: string;
    type: string;
  };
  admissions: {
    undergraduate: {
      gpa_requirement: string;
      sat_range: string;
      act_range: string;
      ielts_requirement: string;
      toefl_requirement: string;
      essays_required: string;
      letters_of_recommendation: string;
      application_fee: string;
      supplemental_materials: string;
    };
  };
  deadlines: {
    regular_decision: string;
    early_action: string;
    early_decision: string;
    scholarship_deadline: string;
    housing_application: string;
  };
  costs: {
    tuition_annual_usd: string;
    room_board_annual_usd: string;
    total_cost_attendance: string;
    financial_aid_available: string;
    average_debt_graduation: string;
  };
  popular_programs: string[];
  admission_requirements: {
    required_courses: string[];
    recommended_courses: string[];
    extracurricular_importance: string;
  };
  student_life: {
    campus_size: string;
    housing_guarantee: string;
    dining_options: string;
    study_abroad_programs: string;
  };
  special_features: string[];
  contact_info: {
    admissions_email: string;
    admissions_phone: string;
  };
  last_updated: string;
}