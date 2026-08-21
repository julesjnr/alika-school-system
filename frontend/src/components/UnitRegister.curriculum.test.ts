import test from 'node:test';
import assert from 'node:assert/strict';

import { getStudentCurriculum } from './UnitRegister';

test('uses the authenticated student course curriculum instead of legacy CS modules', () => {
  const caregiverCourse = {
    id: 'caregiver-1',
    code: 'CERT-CAREGIVER',
    title: 'Certificate in Caregiver',
    description: 'Caregiver training',
    duration: '4 Months',
    fees: 0,
    thumbnail: '',
    faculty: 'Health Sciences',
    active: true,
    courseContent:
      'Patient Care Foundations; Basic Human Anatomy and Physiology; Basic Pharmacology; Basic Physiotherapy and Rehabilitation; Mental Health and Dementia Care; Basic Hospital Procedures and Triage; Nutrition and Dietary Meal Planning; Common Diseases and Chronic Disease Management; Empathy-Driven Communication; Infection Prevention, Control and Microbiology;',
  };

  const result = getStudentCurriculum('caregiver-1', [caregiverCourse], 'Certificate in Caregiver');

  assert.deepEqual(result.items.slice(0, 3), [
    'Patient Care Foundations',
    'Basic Human Anatomy and Physiology',
    'Basic Pharmacology',
  ]);
  assert.equal(result.empty, false);
  assert.equal(result.items.some((item) => item.includes('Web Technologies II') || item.includes('Machine Learning')), false);
});

test('returns the empty state when a programme has no assigned curriculum', () => {
  const result = getStudentCurriculum('missing', [], 'Certificate in Caregiver');

  assert.equal(result.empty, true);
  assert.equal(result.message, 'No curriculum has been assigned to your programme yet.');
});
