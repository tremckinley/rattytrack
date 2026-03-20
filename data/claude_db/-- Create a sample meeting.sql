-- Test Seed Data for Meeting Transcriptions and Issues
-- Generated for Memphis City Council

-- ============================================================================
-- MEETINGS
-- ============================================================================

-- Meeting 1: Public Hearing on Affordable Housing Development
INSERT INTO public.meetings (
  id, legislative_body_id, meeting_type, title, description,
  scheduled_start, scheduled_end, actual_start, actual_end,
  video_url, video_platform, video_id, video_duration_seconds,
  processing_status, transcription_status, analysis_status,
  location, is_virtual, attendance_count, created_at, updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'e1c3ff45-29e2-4227-8af1-a253c3f799ff',
  'Public Hearing',
  'Public Hearing: Binghampton Affordable Housing Development',
  'Public hearing to discuss the proposed 120-unit affordable housing development in the Binghampton neighborhood, including community input and council deliberation.',
  '2025-10-15 14:00:00-05:00',
  '2025-10-15 16:00:00-05:00',
  '2025-10-15 14:03:00-05:00',
  '2025-10-15 15:47:00-05:00',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'youtube',
  'dQw4w9WgXcQ',
  6240,
  'completed',
  'completed',
  'completed',
  'Memphis City Hall, Council Chambers',
  false,
  9,
  '2025-10-15 10:00:00-05:00',
  '2025-10-15 16:00:00-05:00'
);

-- Meeting 2: Transportation Committee Meeting
INSERT INTO public.meetings (
  id, legislative_body_id, meeting_type, title, description,
  scheduled_start, scheduled_end, actual_start, actual_end,
  video_url, video_platform, video_id, video_duration_seconds,
  processing_status, transcription_status, analysis_status,
  location, is_virtual, attendance_count, created_at, updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  'e1c3ff45-29e2-4227-8af1-a253c3f799ff',
  'Committee Meeting',
  'Transportation Committee: MATA Funding and Infrastructure Updates',
  'Regular committee meeting to review MATA budget allocation, discuss bus route modifications, and hear updates on the Madison Avenue Complete Streets project.',
  '2025-10-17 10:00:00-05:00',
  '2025-10-17 12:00:00-05:00',
  '2025-10-17 10:05:00-05:00',
  '2025-10-17 11:52:00-05:00',
  'https://www.youtube.com/watch?v=abc123def456',
  'youtube',
  'abc123def456',
  6420,
  'completed',
  'completed',
  'completed',
  'Memphis City Hall, Committee Room A',
  false,
  7,
  '2025-10-16 09:00:00-05:00',
  '2025-10-17 12:00:00-05:00'
);

-- ============================================================================
-- MEETING ATTENDEES
-- ============================================================================

-- Public Hearing Attendees
INSERT INTO public.meeting_attendees (id, meeting_id, legislator_id, attendance_status, arrival_time, departure_time, created_at) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'b86830da-3a28-40cf-8ff8-66092f60e3a7', 'present', '2025-10-15 14:00:00-05:00', '2025-10-15 15:47:00-05:00', now()),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '08814d6d-1b17-4ccb-96bd-492cb89349f5', 'present', '2025-10-15 14:03:00-05:00', '2025-10-15 15:47:00-05:00', now()),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'cdbca6a6-3d39-4039-9e8b-a54522e66ecd', 'present', '2025-10-15 14:00:00-05:00', '2025-10-15 15:47:00-05:00', now()),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'f79f447f-7170-491b-93a6-37c92f2c7873', 'present', '2025-10-15 14:00:00-05:00', '2025-10-15 15:47:00-05:00', now()),
('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'afbecac2-7b0d-4569-96ca-a96e070ab383', 'present', '2025-10-15 14:00:00-05:00', '2025-10-15 15:47:00-05:00', now()),
('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'babf3017-300d-429d-99d1-ac0de87c0521', 'present', '2025-10-15 14:00:00-05:00', '2025-10-15 15:20:00-05:00', now()),
('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001', '51849896-82aa-4255-8365-3842ceeeaf0b', 'present', '2025-10-15 14:00:00-05:00', '2025-10-15 15:47:00-05:00', now()),
('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440001', '5a5a5556-82f2-4e88-8916-4c026b843114', 'present', '2025-10-15 14:00:00-05:00', '2025-10-15 15:47:00-05:00', now()),
('650e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440001', '14cefb15-ea57-4000-b324-21ce90d515f6', 'present', '2025-10-15 14:00:00-05:00', '2025-10-15 15:47:00-05:00', now());

-- Transportation Committee Attendees
INSERT INTO public.meeting_attendees (id, meeting_id, legislator_id, attendance_status, arrival_time, departure_time, created_at) VALUES
('650e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', 'f79f447f-7170-491b-93a6-37c92f2c7873', 'present', '2025-10-17 10:05:00-05:00', '2025-10-17 11:52:00-05:00', now()),
('650e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440002', '10114253-4881-4331-b58c-a65b005f8347', 'present', '2025-10-17 10:00:00-05:00', '2025-10-17 11:52:00-05:00', now()),
('650e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440002', 'a066ce65-b90c-4e35-afff-16eef98a2fa6', 'present', '2025-10-17 10:05:00-05:00', '2025-10-17 11:52:00-05:00', now()),
('650e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', '23bc701e-7aca-43b2-9673-1c3b8d15b949', 'present', '2025-10-17 10:00:00-05:00', '2025-10-17 11:52:00-05:00', now()),
('650e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440002', '05a09797-3a41-42a8-8aab-52c21d6a7bec', 'present', '2025-10-17 10:05:00-05:00', '2025-10-17 11:52:00-05:00', now()),
('650e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440002', '5b147df1-4dff-4735-a58e-d2d230700d08', 'present', '2025-10-17 10:00:00-05:00', '2025-10-17 11:52:00-05:00', now()),
('650e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440002', 'cdbca6a6-3d39-4039-9e8b-a54522e66ecd', 'absent', null, null, now());

-- ============================================================================
-- TRANSCRIPTION SEGMENTS - PUBLIC HEARING
-- ============================================================================

INSERT INTO public.transcription_segments (
  id, meeting_id, start_time_seconds, end_time_seconds,
  speaker_id, speaker_name, speaker_title, text, text_normalized,
  transcription_confidence, speaker_identification_confidence,
  speaker_identification_method, ai_model_version,
  word_count, sentiment_score, created_at, updated_at
) VALUES
-- Opening by Mayor
('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 0, 45,
 'b86830da-3a28-40cf-8ff8-66092f60e3a7', 'Paul Young', 'Mayor',
 'Good afternoon everyone. I call this public hearing to order. Today we are here to discuss the proposed affordable housing development in the Binghampton neighborhood. This project would bring 120 units of workforce housing to an area that desperately needs it. We will hear from the development team, community members, and then council discussion. Council Member Smiley, would you like to provide some background?',
 'good afternoon everyone i call this public hearing to order today we are here to discuss the proposed affordable housing development in the binghampton neighborhood this project would bring 120 units of workforce housing to an area that desperately needs it we will hear from the development team community members and then council discussion council member smiley would you like to provide some background',
 0.94, 0.98, 'voice_match', 'whisper-large-v3', 78, 0.65, now(), now()),

-- Council Member Smiley provides context
('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 45, 128,
 '08814d6d-1b17-4ccb-96bd-492cb89349f5', 'JB Smiley Jr.', 'Council Member',
 'Thank you, Mayor Young. This development represents a critical step forward for affordable housing in Memphis. Binghampton has seen significant disinvestment over the past decades. We are looking at 120 units with income restrictions between 60 and 80 percent of area median income. The development will include a mix of one, two, and three bedroom units. The developer is requesting a 15-year PILOT agreement to make the project financially viable. I have been working closely with community stakeholders, and while there is strong support, there are also legitimate concerns about displacement and gentrification that we need to address.',
 'thank you mayor young this development represents a critical step forward for affordable housing in memphis binghampton has seen significant disinvestment over the past decades we are looking at 120 units with income restrictions between 60 and 80 percent of area median income the development will include a mix of one two and three bedroom units the developer is requesting a 15 year pilot agreement to make the project financially viable i have been working closely with community stakeholders and while there is strong support there are also legitimate concerns about displacement and gentrification that we need to address',
 0.92, 0.96, 'voice_match', 'whisper-large-v3', 134, 0.72, now(), now()),

-- Council Member Logan raises budget concerns
('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 128, 195,
 'cdbca6a6-3d39-4039-9e8b-a54522e66ecd', 'Rhonda Logan', 'Council Member',
 'I appreciate Council Member Smiley''s work on this, but I have serious concerns about the fiscal impact. A 15-year PILOT means we are forgoing significant property tax revenue during a time when our city budget is already strained. We are talking about infrastructure needs, public safety funding, and essential services that all depend on property tax revenue. I need to see more detailed financial projections. What is the actual cost to the city? What are we giving up in terms of revenue? And how does this compare to other developments that have paid full taxes? I am not opposed to affordable housing, I just want to make sure we are making financially responsible decisions.',
 'i appreciate council member smileys work on this but i have serious concerns about the fiscal impact a 15 year pilot means we are forgoing significant property tax revenue during a time when our city budget is already strained we are talking about infrastructure needs public safety funding and essential services that all depend on property tax revenue i need to see more detailed financial projections what is the actual cost to the city what are we giving up in terms of revenue and how does this compare to other developments that have paid full taxes i am not opposed to affordable housing i just want to make sure we are making financially responsible decisions',
 0.93, 0.97, 'voice_match', 'whisper-large-v3', 145, -0.15, now(), now()),

-- Council Member Morgan supports with infrastructure concerns
('750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 195, 268,
 'f79f447f-7170-491b-93a6-37c92f2c7873', 'Worth Morgan', 'Council Member',
 'Council Member Logan raises valid points about the budget, but I want to emphasize that this is also an infrastructure investment. The Binghampton area has aging water and sewer systems that need upgrades. This development will trigger infrastructure improvements that benefit the entire neighborhood. The developer has committed to covering costs for street repaving, sidewalk repairs, and stormwater management in the immediate area. Additionally, bringing 120 families into this neighborhood will increase economic activity, support local businesses, and ultimately strengthen our tax base. We have to think long-term. Yes, there is a short-term cost with the PILOT, but the community benefits and future revenue potential make this worthwhile.',
 'council member logan raises valid points about the budget but i want to emphasize that this is also an infrastructure investment the binghampton area has aging water and sewer systems that need upgrades this development will trigger infrastructure improvements that benefit the entire neighborhood the developer has committed to covering costs for street repaving sidewalk repairs and stormwater management in the immediate area additionally bringing 120 families into this neighborhood will increase economic activity support local businesses and ultimately strengthen our tax base we have to think long term yes there is a short term cost with the pilot but the community benefits and future revenue potential make this worthwhile',
 0.91, 0.95, 'voice_match', 'whisper-large-v3', 140, 0.68, now(), now()),

-- Public comment period begins
('750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 268, 298,
 'b86830da-3a28-40cf-8ff8-66092f60e3a7', 'Paul Young', 'Mayor',
 'Thank you, Council Member Morgan. At this point, I would like to open the floor to public comments. We have several community members who have signed up to speak. I ask that you please keep your comments to three minutes each. Our first speaker is a resident from the Binghampton neighborhood.',
 'thank you council member morgan at this point i would like to open the floor to public comments we have several community members who have signed up to speak i ask that you please keep your comments to three minutes each our first speaker is a resident from the binghampton neighborhood',
 0.95, 0.99, 'voice_match', 'whisper-large-v3', 56, 0.45, now(), now()),

-- Community member testimony
('750e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 298, 395,
 null, 'Community Member', 'Resident',
 'Good afternoon, council members. My name is Patricia Williams, and I have lived in Binghampton for 32 years. I am here to speak in favor of this development. Our neighborhood has been neglected for too long. We need affordable housing options for working families. My daughter is a nurse at Methodist Hospital, and she cannot afford to live near where she works. This development would give people like her a chance to stay in Memphis and stay in our community. I have heard concerns about gentrification, but right now we have abandoned buildings and vacant lots. This project will bring life back to our streets. I urge the council to approve this development.',
 'good afternoon council members my name is patricia williams and i have lived in binghampton for 32 years i am here to speak in favor of this development our neighborhood has been neglected for too long we need affordable housing options for working families my daughter is a nurse at methodist hospital and she cannot afford to live near where she works this development would give people like her a chance to stay in memphis and stay in our community i have heard concerns about gentrification but right now we have abandoned buildings and vacant lots this project will bring life back to our streets i urge the council to approve this development',
 0.89, 0.72, 'manual_label', 'whisper-large-v3', 140, 0.78, now(), now()),

-- Council Member Benniefield Robinson on transportation access
('750e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001', 395, 478,
 'afbecac2-7b0d-4569-96ca-a96e070ab383', 'Benniefield Robinson', 'Council Member',
 'Thank you for that testimony. I want to add another dimension to this discussion, which is transportation access. Binghampton is currently underserved by public transit. If we are bringing 120 families into this area, we need to ensure they can get to work, school, and services. I have been in conversations with MATA about expanding bus routes in this corridor. The development should include covered bus shelters and pedestrian infrastructure. We cannot just build housing without thinking about how people will move around the city. This ties directly into our broader transportation planning efforts and our commitment to complete streets.',
 'thank you for that testimony i want to add another dimension to this discussion which is transportation access binghampton is currently underserved by public transit if we are bringing 120 families into this area we need to ensure they can get to work school and services i have been in conversations with mata about expanding bus routes in this corridor the development should include covered bus shelters and pedestrian infrastructure we cannot just build housing without thinking about how people will move around the city this ties directly into our broader transportation planning efforts and our commitment to complete streets',
 0.92, 0.96, 'voice_match', 'whisper-large-v3', 128, 0.61, now(), now()),

-- Council Member Joyner discusses public safety
('750e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440001', 478, 562,
 'babf3017-300d-429d-99d1-ac0de87c0521', 'Johnathan Joyner', 'Council Member',
 'I want to echo Council Member Robinson''s points and add that public safety is another critical factor. This development needs adequate lighting, clear sight lines, and coordination with Memphis Police Department for community policing strategies. We have seen how good urban design can reduce crime. Well-lit streets, active ground-floor uses, and eyes on the street make communities safer. I want to make sure the developer is incorporating Crime Prevention Through Environmental Design principles. We also need to ensure adequate police staffing for this area as the population grows. Public safety is not just about enforcement, it is about creating environments where people feel secure.',
 'i want to echo council member robinsons points and add that public safety is another critical factor this development needs adequate lighting clear sight lines and coordination with memphis police department for community policing strategies we have seen how good urban design can reduce crime well lit streets active ground floor uses and eyes on the street make communities safer i want to make sure the developer is incorporating crime prevention through environmental design principles we also need to ensure adequate police staffing for this area as the population grows public safety is not just about enforcement it is about creating environments where people feel secure',
 0.91, 0.94, 'voice_match', 'whisper-large-v3', 135, 0.58, now(), now()),

-- Council Member Catron emphasizes community input
('750e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440001', 562, 638,
 '51849896-82aa-4255-8365-3842ceeeaf0b', 'Carla Catron', 'Council Member',
 'I have been following this project closely and attending community meetings in Binghampton. What I hear consistently is that residents want to be involved in the process. They want input on design, they want job opportunities during construction, and they want assurances about affordability. The developer needs to commit to hiring locally and providing workforce development opportunities. We should also establish a community advisory board for this project. Residents should have a voice not just today at this hearing, but throughout the development and operation of this housing. Community engagement cannot be a one-time checkbox exercise.',
 'i have been following this project closely and attending community meetings in binghampton what i hear consistently is that residents want to be involved in the process they want input on design they want job opportunities during construction and they want assurances about affordability the developer needs to commit to hiring locally and providing workforce development opportunities we should also establish a community advisory board for this project residents should have a voice not just today at this hearing but throughout the development and operation of this housing community engagement cannot be a one time checkbox exercise',
 0.93, 0.97, 'voice_match', 'whisper-large-v3', 125, 0.71, now(), now()),

-- Council Member Moore discusses sustainability
('750e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 638, 712,
 '5a5a5556-82f2-4e88-8916-4c026b843114', 'Shaundra Moore', 'Council Member',
 'As we consider this development, I want to raise the issue of sustainability and energy efficiency. Memphis has committed to climate action goals, and our housing stock plays a major role in energy consumption. This development should meet or exceed current green building standards. We are talking about solar panels, energy-efficient appliances, proper insulation, and water conservation measures. Not only is this good for the environment, but it also reduces utility costs for residents. Lower utility bills mean more affordable housing. I would like to see the developer commit to LEED certification or similar standards. We need to build housing that is sustainable for both residents and the planet.',
 'as we consider this development i want to raise the issue of sustainability and energy efficiency memphis has committed to climate action goals and our housing stock plays a major role in energy consumption this development should meet or exceed current green building standards we are talking about solar panels energy efficient appliances proper insulation and water conservation measures not only is this good for the environment but it also reduces utility costs for residents lower utility bills mean more affordable housing i would like to see the developer commit to leed certification or similar standards we need to build housing that is sustainable for both residents and the planet',
 0.92, 0.96, 'voice_match', 'whisper-large-v3', 137, 0.74, now(), now()),

-- Council Member Johnson on affordability guarantees
('750e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 712, 798,
 '14cefb15-ea57-4000-b324-21ce90d515f6', 'Cheyenne Johnson', 'Council Member',
 'Thank you to all my colleagues for these thoughtful comments. I want to return to the core issue of affordability. We need ironclad guarantees that these units will remain affordable for the full term of the PILOT agreement and ideally beyond. I have seen too many projects where affordability requirements expire and rents immediately skyrocket. We need deed restrictions, ongoing monitoring, and penalties for non-compliance. The income restrictions should be clearly defined, and we need regular reporting on who is actually living in these units. Are they truly serving workforce families? What is the tenant retention rate? I support this project, but we need strong accountability measures written into any agreement we approve.',
 'thank you to all my colleagues for these thoughtful comments i want to return to the core issue of affordability we need ironclad guarantees that these units will remain affordable for the full term of the pilot agreement and ideally beyond i have seen too many projects where affordability requirements expire and rents immediately skyrocket we need deed restrictions ongoing monitoring and penalties for non compliance the income restrictions should be clearly defined and we need regular reporting on who is actually living in these units are they truly serving workforce families what is the tenant retention rate i support this project but we need strong accountability measures written into any agreement we approve',
 0.93, 0.95, 'voice_match', 'whisper-large-v3', 145, 0.66, now(), now()),

-- Mayor Young wraps up discussion
('750e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 798, 865,
 'b86830da-3a28-40cf-8ff8-66092f60e3a7', 'Paul Young', 'Mayor',
 'Thank you all for this robust discussion. I have heard concerns about budget impact, infrastructure needs, transportation access, public safety, community engagement, sustainability, and affordability guarantees. These are all legitimate issues that need to be addressed. I am going to ask the development team to come back with revised plans that address the concerns raised today. We need detailed financial projections, community benefit agreements, transportation plans, and sustainability commitments. This is too important to rush. We will schedule a follow-up hearing once we have more information. This hearing is adjourned.',
 'thank you all for this robust discussion i have heard concerns about budget impact infrastructure needs transportation access public safety community engagement sustainability and affordability guarantees these are all legitimate issues that need to be addressed i am going to ask the development team to come back with revised plans that address the concerns raised today we need detailed financial projections community benefit agreements transportation plans and sustainability commitments this is too important to rush we will schedule a follow up hearing once we have more information this hearing is adjourned',
 0.94, 0.98, 'voice_match', 'whisper-large-v3', 125, 0.52, now(), now());

-- ============================================================================
-- TRANSCRIPTION SEGMENTS - TRANSPORTATION COMMITTEE
-- ============================================================================

INSERT INTO public.transcription_segments (
  id, meeting_id, start_time_seconds, end_time_seconds,
  speaker_id, speaker_name, speaker_title, text, text_normalized,
  transcription_confidence, speaker_identification_confidence,
  speaker_identification_method, ai_model_version,
  word_count, sentiment_score, created_at, updated_at
) VALUES
-- Committee Chair Carlisle opens meeting
('750e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', 0, 42,
 '10114253-4881-4331-b58c-a65b005f8347', 'Chase Carlisle', 'Council Member',
 'Good morning everyone. I call this Transportation Committee meeting to order. We have three main items on our agenda today: MATA budget allocation for fiscal year 2026, proposed bus route modifications based on ridership data, and an update on the Madison Avenue Complete Streets project. Let us start with the MATA budget discussion.',
 'good morning everyone i call this transportation committee meeting to order we have three main items on our agenda today mata budget allocation for fiscal year 2026 proposed bus route modifications based on ridership data and an update on the madison avenue complete streets project let us start with the mata budget discussion',
 0.95, 0.98, 'voice_match', 'whisper-large-v3', 67, 0.48, now(), now()),

-- Council Member Leggett presents MATA budget
('750e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440002', 42, 158,
 'a066ce65-b90c-4e35-afff-16eef98a2fa6', 'Lowery Leggett', 'Council Member',
 'Thank you, Chair Carlisle. I have been working with MATA leadership on the budget proposal. For fiscal year 2026, MATA is requesting 48 million dollars in city funding, which represents an 8 percent increase from the current year. This increase is needed to address several critical issues: maintaining current service levels, replacing aging bus fleet vehicles, upgrading bus stops with better shelters and lighting, and expanding service in underserved areas. The reality is that MATA ridership has been growing over the past year, which is encouraging, but our infrastructure is aging. We have buses that are beyond their useful life, and we have routes where people are being passed up because buses are at capacity. This is an investment in mobility for Memphis residents.',
 'thank you chair carlisle i have been working with mata leadership on the budget proposal for fiscal year 2026 mata is requesting 48 million dollars in city funding which represents an 8 percent increase from the current year this increase is needed to address several critical issues maintaining current service levels replacing aging bus fleet vehicles upgrading bus stops with better shelters and lighting and expanding service in underserved areas the reality is that mata ridership has been growing over the past year which is encouraging but our infrastructure is aging we have buses that are beyond their useful life and we have routes where people are being passed up because buses are at capacity this is an investment in mobility for memphis residents',
 0.91, 0.95, 'voice_match', 'whisper-large-v3', 152, 0.58, now(), now()),

-- Council Member Canale raises budget concerns
('750e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440002', 158, 245,
 '23bc701e-7aca-43b2-9673-1c3b8d15b949', 'J. Ford Canale', 'Council Member',
 'Council Member Leggett, I appreciate the detailed presentation, but I have to express concern about an 8 percent increase in a single year. Our overall city budget is extremely tight. We are dealing with competing priorities across every department. Public safety needs more resources, infrastructure is crumbling, and we have unfunded pension liabilities. An 8 percent increase for MATA means cuts somewhere else. I need to understand what the specific return on investment is here. How many additional riders will we serve? What routes are we talking about expanding? I support public transportation, but we need to be realistic about what we can afford and what the measurable outcomes will be.',
 'council member leggett i appreciate the detailed presentation but i have to express concern about an 8 percent increase in a single year our overall city budget is extremely tight we are dealing with competing priorities across every department public safety needs more resources infrastructure is crumbling and we have unfunded pension liabilities an 8 percent increase for mata means cuts somewhere else i need to understand what the specific return on investment is here how many additional riders will we serve what routes are we talking about expanding i support public transportation but we need to be realistic about what we can afford and what the measurable outcomes will be',
 0.93, 0.97, 'voice_match', 'whisper-large-v3', 138, -0.22, now(), now()),

-- Council Member Robinson on transportation equity
('750e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440002', 245, 342,
 '05a09797-3a41-42a8-8aab-52c21d6a7bec', 'Patrice Robinson', 'Council Member',
 'I understand the budget concerns that Council Member Canale raised, but I want to reframe this discussion. Public transportation is not just a line item in the budget, it is an equity issue. We have residents who depend on MATA to get to work, to access healthcare, to buy groceries. When we underinvest in public transit, we are effectively limiting economic mobility for our most vulnerable residents. The reality is that many Memphians do not have access to personal vehicles. Reliable public transportation is their lifeline. If we cut MATA funding or fail to make necessary investments, we are creating barriers for people trying to improve their lives. This is about more than just buses and routes, it is about opportunity and access.',
 'i understand the budget concerns that council member canale raised but i want to reframe this discussion public transportation is not just a line item in the budget it is an equity issue we have residents who depend on mata to get to work to access healthcare to buy groceries when we underinvest in public transit we are effectively limiting economic mobility for our most vulnerable residents the reality is that many memphians do not have access to personal vehicles reliable public transportation is their lifeline if we cut mata funding or fail to make necessary investments we are creating barriers for people trying to improve their lives this is about more than just buses and routes it is about opportunity and access',
 0.92, 0.96, 'voice_match', 'whisper-large-v3', 147, 0.69, now(), now()),

-- Council Member Jackson discusses route modifications
('750e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440002', 342, 425,
 '5b147df1-4dff-4735-a58e-d2d230700d08', 'Alvin Jackson', 'Council Member',
 'Let me move us to the second agenda item, which is the proposed route modifications. MATA has provided ridership data showing that certain routes are significantly underutilized while others are overcrowded. The proposal is to eliminate three low-ridership routes and redirect those resources to increase frequency on high-demand routes. I know route eliminations are always controversial, but we have routes with fewer than 10 riders per day. Meanwhile, we have routes where people are being left at stops because buses are full. This is about using our limited resources more efficiently. However, I do want to ensure that we are not cutting service to areas that have low ridership simply because residents lack information about the service or because the current schedule does not meet their needs.',
 'let me move us to the second agenda item which is the proposed route modifications mata has provided ridership data showing that certain routes are significantly underutilized while others are overcrowded the proposal is to eliminate three low ridership routes and redirect those resources to increase frequency on high demand routes i know route eliminations are always controversial but we have routes with fewer than 10 riders per day meanwhile we have routes where people are being left at stops because buses are full this is about using our limited resources more efficiently however i do want to ensure that we are not cutting service to areas that have low ridership simply because residents lack information about the service or because the current schedule does not meet their needs',
 0.91, 0.94, 'voice_match', 'whisper-large-v3', 155, 0.35, now(), now()),

-- Chair Carlisle on Madison Avenue Complete Streets
('750e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440002', 425, 518,
 '10114253-4881-4331-b58c-a65b005f8347', 'Chase Carlisle', 'Council Member',
 'Thank you, Council Member Jackson. That brings us to our final item, the Madison Avenue Complete Streets project. This is a major infrastructure investment that will transform Madison Avenue from a car-dominated corridor into a multimodal street that accommodates pedestrians, cyclists, and public transit. The project includes protected bike lanes, wider sidewalks, improved bus stops, better lighting, and street trees. The total cost is 12 million dollars, with 8 million coming from federal transportation grants and 4 million from city funds. Construction is scheduled to begin next spring and take approximately 18 months. This project has been years in the planning, with extensive community input. It is a model for how we should be approaching transportation infrastructure in the 21st century.',
 'thank you council member jackson that brings us to our final item the madison avenue complete streets project this is a major infrastructure investment that will transform madison avenue from a car dominated corridor into a multimodal street that accommodates pedestrians cyclists and public transit the project includes protected bike lanes wider sidewalks improved bus stops better lighting and street trees the total cost is 12 million dollars with 8 million coming from federal transportation grants and 4 million from city funds construction is scheduled to begin next spring and take approximately 18 months this project has been years in the planning with extensive community input it is a model for how we should be approaching transportation infrastructure in the 21st century',
 0.93, 0.98, 'voice_match', 'whisper-large-v3', 148, 0.76, now(), now()),

-- Council Member Canale raises implementation concerns
('750e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440002', 518, 595,
 '23bc701e-7aca-43b2-9673-1c3b8d15b949', 'J. Ford Canale', 'Council Member',
 'Chair Carlisle, I support the goals of this project, but I am concerned about implementation and ongoing maintenance. We have invested in infrastructure projects before only to see them deteriorate because we do not budget adequately for maintenance. Who is responsible for maintaining the bike lanes? Who is clearing snow and debris? What happens when the street trees need pruning or replacement? We need a clear maintenance plan with dedicated funding. I also want to understand the traffic impact. Madison Avenue is a major arterial. How will reducing car lanes affect traffic flow? Have we done adequate traffic modeling? I am not opposed to complete streets, but we need to think through all the implications.',
 'chair carlisle i support the goals of this project but i am concerned about implementation and ongoing maintenance we have invested in infrastructure projects before only to see them deteriorate because we do not budget adequately for maintenance who is responsible for maintaining the bike lanes who is clearing snow and debris what happens when the street trees need pruning or replacement we need a clear maintenance plan with dedicated funding i also want to understand the traffic impact madison avenue is a major arterial how will reducing car lanes affect traffic flow have we done adequate traffic modeling i am not opposed to complete streets but we need to think through all the implications',
 0.92, 0.96, 'voice_match', 'whisper-large-v3', 142, -0.08, now(), now()),

-- Council Member Leggett addresses infrastructure coordination
('750e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440002', 595, 675,
 'a066ce65-b90c-4e35-afff-16eef98a2fa6', 'Lowery Leggett', 'Council Member',
 'Council Member Canale makes excellent points about maintenance. I want to add that we need to coordinate this project with other infrastructure work. Memphis Light Gas and Water has aging water mains under Madison Avenue. If we are tearing up the street for complete streets improvements, this is the time to replace those water mains. We cannot afford to repave Madison Avenue and then tear it up again in two years for utility work. I have been in discussions with MLGW, and they are evaluating the condition of underground infrastructure in this corridor. We should not break ground on the complete streets project until we have a comprehensive plan that addresses all infrastructure needs simultaneously. This is about smart project coordination.',
 'council member canale makes excellent points about maintenance i want to add that we need to coordinate this project with other infrastructure work memphis light gas and water has aging water mains under madison avenue if we are tearing up the street for complete streets improvements this is the time to replace those water mains we cannot afford to repave madison avenue and then tear it up again in two years for utility work i have been in discussions with mlgw and they are evaluating the condition of underground infrastructure in this corridor we should not break ground on the complete streets project until we have a comprehensive plan that addresses all infrastructure needs simultaneously this is about smart project coordination',
 0.91, 0.95, 'voice_match', 'whisper-large-v3', 145, 0.62, now(), now()),

-- Council Member Robinson on community benefits
('750e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440002', 675, 742,
 '05a09797-3a41-42a8-8aab-52c21d6a7bec', 'Patrice Robinson', 'Council Member',
 'I want to highlight the community benefits of this project. The Madison Avenue corridor serves diverse neighborhoods, and improved pedestrian and bike infrastructure will enhance quality of life for residents. Better sidewalks mean safer routes to schools. Protected bike lanes mean more transportation options for people who cannot afford cars. Improved bus stops mean more dignity and comfort for transit riders. These are investments in people. I also want to emphasize that during construction, we need to support local businesses along Madison Avenue. Construction projects can devastate small businesses. We need a plan for maintaining business access, clear signage, and possibly financial assistance for businesses that are negatively impacted.',
 'i want to highlight the community benefits of this project the madison avenue corridor serves diverse neighborhoods and improved pedestrian and bike infrastructure will enhance quality of life for residents better sidewalks mean safer routes to schools protected bike lanes mean more transportation options for people who cannot afford cars improved bus stops mean more dignity and comfort for transit riders these are investments in people i also want to emphasize that during construction we need to support local businesses along madison avenue construction projects can devastate small businesses we need a plan for maintaining business access clear signage and possibly financial assistance for businesses that are negatively impacted',
 0.92, 0.96, 'voice_match', 'whisper-large-v3', 133, 0.71, now(), now()),

-- Chair Carlisle wraps up meeting
('750e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440002', 742, 798,
 '10114253-4881-4331-b58c-a65b005f8347', 'Chase Carlisle', 'Council Member',
 'Thank you all for this productive discussion. We have covered a lot of ground today. On the MATA budget, I am going to ask staff to provide additional financial analysis and ridership projections before we make a recommendation to the full council. On route modifications, we need more community input before making final decisions. And on the Madison Avenue Complete Streets project, we need to coordinate with MLGW and develop a comprehensive maintenance plan. I will schedule a follow-up committee meeting in three weeks to continue these discussions. This meeting is adjourned.',
 'thank you all for this productive discussion we have covered a lot of ground today on the mata budget i am going to ask staff to provide additional financial analysis and ridership projections before we make a recommendation to the full council on route modifications we need more community input before making final decisions and on the madison avenue complete streets project we need to coordinate with mlgw and develop a comprehensive maintenance plan i will schedule a follow up committee meeting in three weeks to continue these discussions this meeting is adjourned',
 0.94, 0.98, 'voice_match', 'whisper-large-v3', 117, 0.55, now(), now());

-- ============================================================================
-- SEGMENT ISSUES - PUBLIC HEARING
-- ============================================================================

INSERT INTO public.segment_issues (
  id, segment_id, issue_id, relevance_score, sentiment_score,
  ai_model_version, key_phrases, created_at
) VALUES
-- Housing issue links
('850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', '390b5e35-c00d-4741-abb3-9c84b27ef6d0', 0.95, 0.65, 'gpt-4', ARRAY['affordable housing development', 'workforce housing', 'Binghampton neighborhood'], now()),
('850e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440002', '390b5e35-c00d-4741-abb3-9c84b27ef6d0', 0.98, 0.72, 'gpt-4', ARRAY['affordable housing', '120 units', 'area median income', 'displacement', 'gentrification'], now()),
('850e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440002', 'fb869255-6e89-4dfd-a39b-5858506e1920', 0.82, 0.72, 'gpt-4', ARRAY['PILOT agreement', 'financially viable'], now()),
('850e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440003', 'fb869255-6e89-4dfd-a39b-5858506e1920', 0.92, -0.15, 'gpt-4', ARRAY['fiscal impact', 'property tax revenue', 'city budget', 'financial projections'], now()),
('850e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440003', '502c263a-8121-497f-96b0-0851d30bd384', 0.65, -0.15, 'gpt-4', ARRAY['public safety funding', 'essential services'], now()),
('850e8400-e29b-41d4-a716-446655440006', '750e8400-e29b-41d4-a716-446655440004', '1ab16e7c-79dd-421f-bed0-bf70c3c63971', 0.89, 0.68, 'gpt-4', ARRAY['infrastructure investment', 'water and sewer systems', 'street repaving', 'sidewalk repairs', 'stormwater management'], now()),
('850e8400-e29b-41d4-a716-446655440007', '750e8400-e29b-41d4-a716-446655440004', 'fb869255-6e89-4dfd-a39b-5858506e1920', 0.78, 0.68, 'gpt-4', ARRAY['tax base', 'revenue potential', 'economic activity'], now()),
('850e8400-e29b-41d4-a716-446655440008', '750e8400-e29b-41d4-a716-446655440006', '390b5e35-c00d-4741-abb3-9c84b27ef6d0', 0.94, 0.78, 'gpt-4', ARRAY['affordable housing options', 'working families', 'abandoned buildings'], now()),
('850e8400-e29b-41d4-a716-446655440009', '750e8400-e29b-41d4-a716-446655440007', 'f79f447f-7170-491b-93a6-37c92f2c7873', 0.93, 0.61, 'gpt-4', ARRAY['transportation access', 'public transit', 'MATA', 'bus routes', 'bus shelters', 'pedestrian infrastructure'], now()),
('850e8400-e29b-41d4-a716-446655440010', '750e8400-e29b-41d4-a716-446655440008', '502c263a-8121-497f-96b0-0851d30bd384', 0.91, 0.58, 'gpt-4', ARRAY['public safety', 'adequate lighting', 'Memphis Police Department', 'Crime Prevention Through Environmental Design', 'police staffing'], now()),
('850e8400-e29b-41d4-a716-446655440011', '750e8400-e29b-41d4-a716-446655440009', '390b5e35-c00d-4741-abb3-9c84b27ef6d0', 0.87, 0.71, 'gpt-4', ARRAY['community input', 'job opportunities', 'affordability', 'workforce development', 'community advisory board'], now()),
('850e8400-e29b-41d4-a716-446655440012', '750e8400-e29b-41d4-a716-446655440011', '390b5e35-c00d-4741-abb3-9c84b27ef6d0', 0.96, 0.66, 'gpt-4', ARRAY['affordability guarantees', 'deed restrictions', 'income restrictions', 'tenant retention'], now()),
('850e8400-e29b-41d4-a716-446655440013', '750e8400-e29b-41d4-a716-446655440012', 'fb869255-6e89-4dfd-a39b-5858506e1920', 0.85, 0.52, 'gpt-4', ARRAY['budget impact', 'financial projections', 'community benefit agreements'], now()),
('850e8400-e29b-41d4-a716-446655440014', '750e8400-e29b-41d4-a716-446655440012', '1ab16e7c-79dd-421f-bed0-bf70c3c63971', 0.82, 0.52, 'gpt-4', ARRAY['infrastructure needs', 'transportation plans'], now()),
('850e8400-e29b-41d4-a716-446655440015', '750e8400-e29b-41d4-a716-446655440012', 'f79f447f-7170-491b-93a6-37c92f2c7873', 0.79, 0.52, 'gpt-4', ARRAY['transportation plans'], now());

-- ============================================================================
-- SEGMENT ISSUES - TRANSPORTATION COMMITTEE
-- ============================================================================

INSERT INTO public.segment_issues (
  id, segment_id, issue_id, relevance_score, sentiment_score,
  ai_model_version, key_phrases, created_at
) VALUES
('850e8400-e29b-41d4-a716-446655440016', '750e8400-e29b-41d4-a716-446655440013', 'f79f447f-7170-491b-93a6-37c92f2c7873', 0.97, 0.48, 'gpt-4', ARRAY['MATA budget', 'bus route modifications', 'Madison Avenue Complete Streets'], now()),
('850e8400-e29b-41d4-a716-446655440017', '750e8400-e29b-41d4-a716-446655440014', 'f79f447f-7170-491b-93a6-37c92f2c7873', 0.96, 0.58, 'gpt-4', ARRAY['MATA funding', 'bus fleet vehicles', 'bus stops', 'service expansion'], now()),
('850e8400-e29b-41d4-a716-446655440018', '750e8400-e29b-41d4-a716-446655440014', 'fb869255-6e89-4dfd-a39b-5858506e1920', 0.88, 0.58, 'gpt-4', ARRAY['budget proposal', '48 million dollars', 'city funding'], now()),
('850e8400-e29b-41d4-a716-446655440019', '750e8400-e29b-41d4-a716-446655440015', 'fb869255-6e89-4dfd-a39b-5858506e1920', 0.94, -0.22, 'gpt-4', ARRAY['city budget', 'budget constraints', 'competing priorities', 'return on investment'], now()),
('850e8400-e29b-41d4-a716-446655440020', '750e8400-e29b-41d4-a716-446655440015', '502c263a-8121-497f-96b0-0851d30bd384', 0.72, -0.22, 'gpt-4', ARRAY['public safety needs more resources'], now()),
('850e8400-e29b-41d4-a716-446655440021', '750e8400-e29b-41d4-a716-446655440015', '1ab16e7c-79dd-421f-bed0-bf70c3c63971', 0.68, -0.22, 'gpt-4', ARRAY['infrastructure is crumbling'], now()),
('850e8400-e29b-41d4-a716-446655440022', '750e8400-e29b-41d4-a716-446655440016', 'f79f447f-7170-491b-93a6-37c92f2c7873', 0.95, 0.69, 'gpt-4', ARRAY['public transportation', 'equity issue', 'economic mobility', 'access to transit'], now()),
('850e8400-e29b-41d4-a716-446655440023', '750e8400-e29b-41d4-a716-446655440017', 'f79f447f-7170-491b-93a6-37c92f2c7873', 0.92, 0.35, 'gpt-4', ARRAY['route modifications', 'ridership data', 'service frequency', 'resource efficiency'], now()),
('850e8400-e29b-41d4-a716-446655440024', '750e8400-e29b-41d4-a716-446655440018', 'f79f447f-7170-491b-93a6-37c92f2c7873', 0.94, 0.76, 'gpt-4', ARRAY['Madison Avenue Complete Streets', 'multimodal street', 'pedestrians', 'cyclists', 'public transit'], now()),
('850e8400-e29b-41d4-a716-446655440025', '750e8400-e29b-41d4-a716-446655440018', '1ab16e7c-79dd-421f-bed0-bf70c3c63971', 0.91, 0.76, 'gpt-4', ARRAY['infrastructure investment', 'protected bike lanes', 'wider sidewalks', 'improved bus stops', 'street trees'], now()),
('850e8400-e29b-41d4-a716-446655440026', '750e8400-e29b-41d4-a716-446655440019', '1ab16e7c-79dd-421f-bed0-bf70c3c63971', 0.89, -0.08, 'gpt-4', ARRAY['implementation', 'maintenance', 'bike lanes', 'infrastructure projects'], now()),
('850e8400-e29b-41d4-a716-446655440027', '750e8400-e29b-41d4-a716-446655440019', 'fb869255-6e89-4dfd-a39b-5858506e1920', 0.76, -0.08, 'gpt-4', ARRAY['maintenance plan', 'dedicated funding'], now()),
('850e8400-e29b-41d4-a716-446655440028', '750e8400-e29b-41d4-a716-446655440020', '1ab16e7c-79dd-421f-bed0-bf70c3c63971', 0.96, 0.62, 'gpt-4', ARRAY['infrastructure coordination', 'water mains', 'utility work', 'project coordination'], now()),
('850e8400-e29b-41d4-a716-446655440029', '750e8400-e29b-41d4-a716-446655440021', 'f79f447f-7170-491b-93a6-37c92f2c7873', 0.88, 0.71, 'gpt-4', ARRAY['pedestrian infrastructure', 'bike infrastructure', 'safer routes', 'bus stops'], now()),
('850e8400-e29b-41d4-a716-446655440030', '750e8400-e29b-41d4-a716-446655440022', 'f79f447f-7170-491b-93a6-37c92f2c7873', 0.85, 0.55, 'gpt-4', ARRAY['MATA budget', 'route modifications', 'Complete Streets project'], now()),
('850e8400-e29b-41d4-a716-446655440031', '750e8400-e29b-41d4-a716-446655440022', 'fb869255-6e89-4dfd-a39b-5858506e1920', 0.79, 0.55, 'gpt-4', ARRAY['financial analysis', 'ridership projections'], now());

-- ============================================================================
-- PROCESSING JOBS
-- ============================================================================

-- ============================================================================
-- PROCESSING JOBS
-- ============================================================================

INSERT INTO public.processing_jobs (
  id, job_type, status, meeting_id, ai_model,
  parameters, progress_percentage, items_processed, items_total,
  started_at, completed_at, result_summary, created_at, updated_at
) VALUES
-- Public Hearing transcription job
('950e8400-e29b-41d4-a716-446655440001',
 'transcription',
 'completed',
 '550e8400-e29b-41d4-a716-446655440001',
 'whisper-large-v3',
 '{"language": "en", "task": "transcribe", "temperature": 0.0}'::jsonb,
 100.00,
 12,
 12,
 '2025-10-15 15:50:00-05:00',
 '2025-10-15 16:45:00-05:00',
 '{"total_segments": 12, "total_duration_seconds": 6240, "average_confidence": 0.926, "speakers_identified": 10}'::jsonb,
 '2025-10-15 15:50:00-05:00',
 '2025-10-15 16:45:00-05:00'),

-- Public Hearing speaker identification job
('950e8400-e29b-41d4-a716-446655440002',
 'speaker_identification',
 'completed',
 '550e8400-e29b-41d4-a716-446655440001',
 'pyannote-3.1',
 '{"min_speakers": 8, "max_speakers": 12}'::jsonb,
 100.00,
 12,
 12,
 '2025-10-15 16:46:00-05:00',
 '2025-10-15 17:12:00-05:00',
 '{"speakers_detected": 10, "segments_matched": 11, "segments_manual": 1, "average_confidence": 0.956}'::jsonb,
 '2025-10-15 16:46:00-05:00',
 '2025-10-15 17:12:00-05:00'),

-- Public Hearing issue analysis job
('950e8400-e29b-41d4-a716-446655440003',
 'issue_analysis',
 'completed',
 '550e8400-e29b-41d4-a716-446655440001',
 'gpt-4',
 '{"min_relevance_score": 0.6, "include_sentiment": true}'::jsonb,
 100.00,
 12,
 12,
 '2025-10-15 17:13:00-05:00',
 '2025-10-15 17:28:00-05:00',
 '{"issues_identified": 5, "total_issue_links": 15, "average_relevance": 0.867, "segments_analyzed": 12}'::jsonb,
 '2025-10-15 17:13:00-05:00',
 '2025-10-15 17:28:00-05:00'),

-- Transportation Committee transcription job
('950e8400-e29b-41d4-a716-446655440004',
 'transcription',
 'completed',
 '550e8400-e29b-41d4-a716-446655440002',
 'whisper-large-v3',
 '{"language": "en", "task": "transcribe", "temperature": 0.0}'::jsonb,
 100.00,
 10,
 10,
 '2025-10-17 12:00:00-05:00',
 '2025-10-17 12:52:00-05:00',
 '{"total_segments": 10, "total_duration_seconds": 6420, "average_confidence": 0.923, "speakers_identified": 6}'::jsonb,
 '2025-10-17 12:00:00-05:00',
 '2025-10-17 12:52:00-05:00'),

-- Transportation Committee speaker identification job
('950e8400-e29b-41d4-a716-446655440005',
 'speaker_identification',
 'completed',
 '550e8400-e29b-41d4-a716-446655440002',
 'pyannote-3.1',
 '{"min_speakers": 5, "max_speakers": 8}'::jsonb,
 100.00,
 10,
 10,
 '2025-10-17 12:53:00-05:00',
 '2025-10-17 13:18:00-05:00',
 '{"speakers_detected": 6, "segments_matched": 10, "segments_manual": 0, "average_confidence": 0.964}'::jsonb,
 '2025-10-17 12:53:00-05:00',
 '2025-10-17 13:18:00-05:00'),

-- Transportation Committee issue analysis job
('950e8400-e29b-41d4-a716-446655440006',
 'issue_analysis',
 'completed',
 '550e8400-e29b-41d4-a716-446655440002',
 'gpt-4',
 '{"min_relevance_score": 0.6, "include_sentiment": true}'::jsonb,
 100.00,
 10,
 10,
 '2025-10-17 13:19:00-05:00',
 '2025-10-17 13:32:00-05:00',
 '{"issues_identified": 4, "total_issue_links": 16, "average_relevance": 0.876, "segments_analyzed": 10}'::jsonb,
 '2025-10-17 13:19:00-05:00',
 '2025-10-17 13:32:00-05:00');

-- ============================================================================
-- LEGISLATIVE ACTIONS (for future bill tracking)
-- ============================================================================

-- Note: These are placeholder legislative actions that could be created
-- if bills are introduced related to these meetings

-- Example: Housing Development Resolution (would be created after the hearing)
-- Example: MATA Budget Appropriation (would be created after committee approval)

-- ============================================================================
-- SUMMARY STATISTICS
-- ============================================================================

-- This seed data includes:
-- - 2 meetings (1 public hearing, 1 committee meeting)
-- - 16 meeting attendees total
-- - 22 transcription segments with realistic political discussion
-- - 31 segment-issue links across 5 different issues
-- - 6 processing jobs (transcription, speaker ID, and issue analysis for both meetings)
--
-- Issues covered:
-- - Housing (390b5e35-c00d-4741-abb3-9c84b27ef6d0): 8 segment links
-- - Budget (fb869255-6e89-4dfd-a39b-5858506e1920): 8 segment links
-- - Infrastructure (1ab16e7c-79dd-421f-bed0-bf70c3c63971): 7 segment links
-- - Transportation (f79f447f-7170-491b-93a6-37c92f2c7873): 11 segment links
-- - Public Safety (502c263a-8121-497f-96b0-0851d30bd384): 3 segment links
--
-- Legislators with speaking roles:
-- - Paul Young (Mayor): 3 segments
-- - JB Smiley Jr.: 1 segment
-- - Rhonda Logan: 1 segment
-- - Worth Morgan: 1 segment
-- - Benniefield Robinson: 1 segment
-- - Johnathan Joyner: 1 segment
-- - Carla Catron: 1 segment
-- - Shaundra Moore: 1 segment
-- - Cheyenne Johnson: 1 segment
-- - Chase Carlisle (Committee Chair): 3 segments
-- - Lowery Leggett: 2 segments
-- - J. Ford Canale: 2 segments
-- - Patrice Robinson: 2 segments
-- - Alvin Jackson: 1 segment
-- - Community Member (non-legislator): 1 segmentsegments": 12, "total_duration_seconds": 6240, "average_confidence": 0.926, "speakers_identified": 10}'::jsonb,