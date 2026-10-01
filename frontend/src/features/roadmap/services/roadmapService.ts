/**
 * VERNIQ Roadmap Service
 * =======================
 * Communicates with Supabase backend and joins Problem Catalog references.
 * Contains deterministic fallback offline data adhering strictly to the contract.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import type {
  Roadmap,
  RoadmapSprint,
  RoadmapDay,
  RoadmapItem,
  RoadmapItemStatus,
  ProblemSummary,
  RoadmapProblemReference,
} from '../types';

export const FALLBACK_STRUCTURED_ROADMAP: Roadmap = {
  id: '00000000-0000-0000-0000-000000000801',
  title: 'DSA Interview Mastery',
  slug: 'dsa-mastery',
  description:
    'A rigorous sprint-and-day structured engineering roadmap designed for top-tier software engineering interviews. Invariant-driven algorithmic progressions with verified Problem Catalog references.',
  estimatedDuration: '~120 Hours',
  totalSprints: 12,
  iconName: 'Compass',
  position: 1,
  isPublished: true,
  phases: [
    {
      id: '00000000-0000-0000-0000-000000000811',
      roadmapId: '00000000-0000-0000-0000-000000000801',
      title: 'Core Algorithmic Foundations',
      slug: 'core-foundations',
      description: 'Master essential data structures, linear invariants, and space-time tradeoffs.',
      position: 1,
    },
  ],
  sprints: [
    {
      id: '00000000-0000-0000-0000-000000000821',
      roadmapId: '00000000-0000-0000-0000-000000000801',
      phaseId: '00000000-0000-0000-0000-000000000811',
      title: 'Sprint 1 — Arrays, Two Pointers & Invariants',
      slug: 'sprint-1-arrays-two-pointers',
      description:
        'Master linear scans, hash table lookups, sliding windows, and invariant proofs on contiguous sequences.',
      position: 1,
      estimatedHours: 12,
      isPublished: true,
      days: [
        {
          id: '00000000-0000-0000-0000-000000000831',
          sprintId: '00000000-0000-0000-0000-000000000821',
          dayNumber: 1,
          title: 'Linear Search, Hashing & Complement Invariants',
          description:
            'Formulate formal loop invariants for complement lookups and prove O(n) worst-case time complexity.',
          learningObjectives: [
            'Understand complement hashing pattern',
            'Prove O(n) single-pass safety',
            'Formulate loop invariant',
          ],
          position: 1,
          topics: [
            {
              id: '00000000-0000-0000-0000-000000000841',
              dayId: '00000000-0000-0000-0000-000000000831',
              title: 'Complement Lookups & Hash Mapping',
              description: 'Algorithmic formulations for pairing elements with zero quadratic overhead.',
              position: 1,
              items: [],
            },
          ],
          items: [
            {
              id: '00000000-0000-0000-0000-000000000851',
              dayId: '00000000-0000-0000-0000-000000000831',
              topicId: '00000000-0000-0000-0000-000000000841',
              title: 'Concept: Invariant Formulation for Array Complement Lookups',
              description:
                'Formal definition of the complement invariant: for any index i, table contains all elements in 0..i-1.',
              itemType: 'CONCEPT',
              position: 1,
              required: true,
              estimatedMinutes: 15,
            },
            {
              id: '00000000-0000-0000-0000-000000000852',
              dayId: '00000000-0000-0000-0000-000000000831',
              topicId: '00000000-0000-0000-0000-000000000841',
              title: 'Lecture: Safe Hash Table Lookups & Memory Bounds',
              description:
                'Deep dive into collision handling, load factors, and cache locality for associative lookups.',
              itemType: 'LECTURE',
              position: 2,
              required: false,
              estimatedMinutes: 20,
            },
            {
              id: '00000000-0000-0000-0000-000000000853',
              dayId: '00000000-0000-0000-0000-000000000831',
              topicId: '00000000-0000-0000-0000-000000000841',
              title: 'Practice: Solve Two Sum',
              description:
                'Implement the canonical single-pass hash map solution and submit to the VERNIQ execution judge.',
              itemType: 'PROBLEM',
              position: 3,
              required: true,
              estimatedMinutes: 25,
              problemReference: {
                id: 'ref-1',
                roadmapItemId: '00000000-0000-0000-0000-000000000853',
                verniqProblemId: 'VRQ-000001',
                position: 1,
                required: true,
                problemSummary: {
                  verniqId: 'VRQ-000001',
                  title: 'Two Sum',
                  difficulty: 'easy',
                  slug: 'two-sum',
                  topics: ['Arrays', 'Hash Table'],
                },
              },
            },
            {
              id: '00000000-0000-0000-0000-000000000854',
              dayId: '00000000-0000-0000-0000-000000000831',
              topicId: '00000000-0000-0000-0000-000000000841',
              title: 'Revision: Single-Pass vs Two-Pass Space Tradeoffs',
              description: 'Review memory footprints and early-exit termination conditions.',
              itemType: 'REVISION',
              position: 4,
              required: false,
              estimatedMinutes: 10,
            },
          ],
        },
        {
          id: '00000000-0000-0000-0000-000000000832',
          sprintId: '00000000-0000-0000-0000-000000000821',
          dayNumber: 2,
          title: 'Window Expansion & Dynamic Two Pointers',
          description:
            'Build shrinking and expanding window invariants to guarantee subsegment correctness.',
          learningObjectives: [
            'Master shrinking window conditions',
            'Handle non-negative arrays',
            'Identify monotonic window boundaries',
          ],
          position: 2,
          topics: [
            {
              id: '00000000-0000-0000-0000-000000000842',
              dayId: '00000000-0000-0000-0000-000000000832',
              title: 'Sliding Window & Substring Bounds',
              description: 'Two-pointer window expansion and contraction logic.',
              position: 1,
              items: [],
            },
          ],
          items: [
            {
              id: '00000000-0000-0000-0000-000000000855',
              dayId: '00000000-0000-0000-0000-000000000832',
              topicId: '00000000-0000-0000-0000-000000000842',
              title: 'Concept: Monotonic Sliding Window Conditions',
              description:
                'Establishing left and right boundary rules and frequency map invariant updates.',
              itemType: 'CONCEPT',
              position: 1,
              required: true,
              estimatedMinutes: 15,
            },
            {
              id: '00000000-0000-0000-0000-000000000856',
              dayId: '00000000-0000-0000-0000-000000000832',
              topicId: '00000000-0000-0000-0000-000000000842',
              title: 'Practice: Longest Substring Without Repeating Characters',
              description: 'Apply dynamic sliding window with character last-seen index tracking.',
              itemType: 'PROBLEM',
              position: 2,
              required: true,
              estimatedMinutes: 35,
              problemReference: {
                id: 'ref-2',
                roadmapItemId: '00000000-0000-0000-0000-000000000856',
                verniqProblemId: 'VRQ-000005',
                position: 1,
                required: true,
                problemSummary: {
                  verniqId: 'VRQ-000005',
                  title: 'Longest Substring Without Repeating Characters',
                  difficulty: 'medium',
                  slug: 'longest-substring-without-repeating-characters',
                  topics: ['Hash Table', 'String', 'Sliding Window'],
                },
              },
            },
            {
              id: '00000000-0000-0000-0000-000000000857',
              dayId: '00000000-0000-0000-0000-000000000832',
              topicId: '00000000-0000-0000-0000-000000000842',
              title: 'Practice: Best Time to Buy and Sell Stock',
              description: 'Formulate single-pass minimum valley tracking invariant.',
              itemType: 'PROBLEM',
              position: 3,
              required: true,
              estimatedMinutes: 20,
              problemReference: {
                id: 'ref-3',
                roadmapItemId: '00000000-0000-0000-0000-000000000857',
                verniqProblemId: 'VRQ-000006',
                position: 2,
                required: true,
                problemSummary: {
                  verniqId: 'VRQ-000006',
                  title: 'Best Time to Buy and Sell Stock',
                  difficulty: 'easy',
                  slug: 'best-time-to-buy-and-sell-stock',
                  topics: ['Array', 'Dynamic Programming'],
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: '00000000-0000-0000-0000-000000000822',
      roadmapId: '00000000-0000-0000-0000-000000000801',
      phaseId: '00000000-0000-0000-0000-000000000811',
      title: 'Sprint 2 — Stacks, Queues & Monotonic Sequences',
      slug: 'sprint-2-stacks-queues',
      description:
        'Understand lifo invariants, parentheses parsing, and monotonic stack boundary sweeps.',
      position: 2,
      estimatedHours: 10,
      isPublished: true,
      days: [
        {
          id: '00000000-0000-0000-0000-000000000833',
          sprintId: '00000000-0000-0000-0000-000000000822',
          dayNumber: 3,
          title: 'Balanced Sequences & Monotonic Stack',
          description:
            'Master balanced matching invariants and monotonic boundary reduction for elevation histograms.',
          learningObjectives: [
            'Recognize lifo matching invariants',
            'Maintain monotonic stack order',
            'Calculate bounded histogram areas',
          ],
          position: 1,
          topics: [
            {
              id: '00000000-0000-0000-0000-000000000843',
              dayId: '00000000-0000-0000-0000-000000000833',
              title: 'Lifo Evaluation & Monotonic Stack',
              description: 'Stack frame state evaluation and monotonic height boundaries.',
              position: 1,
              items: [],
            },
          ],
          items: [
            {
              id: '00000000-0000-0000-0000-000000000858',
              dayId: '00000000-0000-0000-0000-000000000833',
              topicId: '00000000-0000-0000-0000-000000000843',
              title: 'Concept: Bracket Matching Invariant & Depth Counters',
              description: 'Proving grammar nesting correctness using LIFO stack state machines.',
              itemType: 'CONCEPT',
              position: 1,
              required: true,
              estimatedMinutes: 15,
            },
            {
              id: '00000000-0000-0000-0000-000000000859',
              dayId: '00000000-0000-0000-0000-000000000833',
              topicId: '00000000-0000-0000-0000-000000000843',
              title: 'Practice: Valid Parentheses',
              description: 'Solve delimiter matching with map lookup and early-fail guards.',
              itemType: 'PROBLEM',
              position: 2,
              required: true,
              estimatedMinutes: 20,
              problemReference: {
                id: 'ref-4',
                roadmapItemId: '00000000-0000-0000-0000-000000000859',
                verniqProblemId: 'VRQ-000004',
                position: 1,
                required: true,
                problemSummary: {
                  verniqId: 'VRQ-000004',
                  title: 'Valid Parentheses',
                  difficulty: 'easy',
                  slug: 'valid-parentheses',
                  topics: ['String', 'Stack'],
                },
              },
            },
            {
              id: '00000000-0000-0000-0000-000000000860',
              dayId: '00000000-0000-0000-0000-000000000833',
              topicId: '00000000-0000-0000-0000-000000000843',
              title: 'Practice: Trapping Rain Water',
              description: 'Compute volumetric retention using two pointers or monotonic decreasing stack.',
              itemType: 'PROBLEM',
              position: 3,
              required: true,
              estimatedMinutes: 45,
              problemReference: {
                id: 'ref-5',
                roadmapItemId: '00000000-0000-0000-0000-000000000860',
                verniqProblemId: 'VRQ-000010',
                position: 2,
                required: true,
                problemSummary: {
                  verniqId: 'VRQ-000010',
                  title: 'Trapping Rain Water',
                  difficulty: 'hard',
                  slug: 'trapping-rain-water',
                  topics: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack'],
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: '00000000-0000-0000-0000-000000000823',
      roadmapId: '00000000-0000-0000-0000-000000000801',
      phaseId: '00000000-0000-0000-0000-000000000811',
      title: 'Sprint 3 — Intervals, Hash Maps & Caching Systems',
      slug: 'sprint-3-intervals-caching',
      description: 'Interval scheduling, segment merging, and combined linked-list hash map architectures.',
      position: 3,
      estimatedHours: 14,
      isPublished: true,
      days: [
        {
          id: '00000000-0000-0000-0000-000000000834',
          sprintId: '00000000-0000-0000-0000-000000000823',
          dayNumber: 4,
          title: 'Interval Merging & Cache Eviction Topology',
          description: 'Master sorted interval sweep line invariants and O(1) eviction mechanics.',
          learningObjectives: [
            'Sort-and-merge sweep invariant',
            'O(1) doubly linked list + map synchronization',
            'Evict least recently used entries safely',
          ],
          position: 1,
          topics: [
            {
              id: '00000000-0000-0000-0000-000000000844',
              dayId: '00000000-0000-0000-0000-000000000834',
              title: 'Interval Sweep & LRU Eviction',
              description: 'Sweep line algorithms and composite data structures.',
              position: 1,
              items: [],
            },
          ],
          items: [
            {
              id: '00000000-0000-0000-0000-000000000861',
              dayId: '00000000-0000-0000-0000-000000000834',
              topicId: '00000000-0000-0000-0000-000000000844',
              title: 'Concept: Sweep-Line Invariant for Interval Overlaps',
              description: 'Sorting start boundaries and expanding end boundaries iteratively.',
              itemType: 'CONCEPT',
              position: 1,
              required: true,
              estimatedMinutes: 20,
            },
            {
              id: '00000000-0000-0000-0000-000000000862',
              dayId: '00000000-0000-0000-0000-000000000834',
              topicId: '00000000-0000-0000-0000-000000000844',
              title: 'Practice: Merge Intervals',
              description: 'Sort by starting coordinate and greedily absorb overlapping intervals.',
              itemType: 'PROBLEM',
              position: 2,
              required: true,
              estimatedMinutes: 30,
              problemReference: {
                id: 'ref-6',
                roadmapItemId: '00000000-0000-0000-0000-000000000862',
                verniqProblemId: 'VRQ-000003',
                position: 1,
                required: true,
                problemSummary: {
                  verniqId: 'VRQ-000003',
                  title: 'Merge Intervals',
                  difficulty: 'medium',
                  slug: 'merge-intervals',
                  topics: ['Array', 'Sorting'],
                },
              },
            },
            {
              id: '00000000-0000-0000-0000-000000000863',
              dayId: '00000000-0000-0000-0000-000000000834',
              topicId: '00000000-0000-0000-0000-000000000844',
              title: 'Practice: LRU Cache Design',
              description:
                'Build combined Doubly Linked List and Hash Map with O(1) get and put operations.',
              itemType: 'PROBLEM',
              position: 3,
              required: true,
              estimatedMinutes: 45,
              problemReference: {
                id: 'ref-7',
                roadmapItemId: '00000000-0000-0000-0000-000000000863',
                verniqProblemId: 'VRQ-000002',
                position: 2,
                required: true,
                problemSummary: {
                  verniqId: 'VRQ-000002',
                  title: 'LRU Cache',
                  difficulty: 'medium',
                  slug: 'lru-cache',
                  topics: ['Hash Table', 'Linked List', 'Design', 'Doubly-Linked List'],
                },
              },
            },
          ],
        },
      ],
    },
  ],
};

const LOCAL_STORAGE_KEY_PREFIX = 'verniq_roadmap_item_progress_';

export const roadmapService = {
  /**
   * Fetches the complete roadmap tree, joining problem catalog references dynamically.
   */
  async getRoadmapBySlug(slug: string = 'dsa-mastery'): Promise<Roadmap> {
    if (!isSupabaseConfigured()) {
      return FALLBACK_STRUCTURED_ROADMAP;
    }

    try {
      // 1. Fetch roadmap record
      const { data: rRow, error: rErr } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();

      if (rErr || !rRow) {
        return FALLBACK_STRUCTURED_ROADMAP;
      }

      const roadmapId = rRow.id;

      // 2. Fetch sprints
      const { data: sprintRows } = await supabase
        .from('roadmap_sprints')
        .select('*')
        .eq('roadmap_id', roadmapId)
        .eq('is_published', true)
        .order('position', { ascending: true });

      if (!sprintRows || sprintRows.length === 0) {
        return FALLBACK_STRUCTURED_ROADMAP;
      }

      const sprintIds = sprintRows.map((s) => s.id);

      // 3. Fetch days
      const { data: dayRows } = await supabase
        .from('roadmap_days')
        .select('*')
        .in('sprint_id', sprintIds)
        .order('position', { ascending: true });

      const dayIds = (dayRows || []).map((d) => d.id);

      // 4. Fetch day topics
      const { data: topicRows } = await supabase
        .from('roadmap_day_topics')
        .select('*')
        .in('day_id', dayIds)
        .order('position', { ascending: true });

      // 5. Fetch items
      const { data: itemRows } = await supabase
        .from('roadmap_items')
        .select('*')
        .in('day_id', dayIds)
        .order('position', { ascending: true });

      const itemIds = (itemRows || []).map((i) => i.id);

      // 6. Fetch problem references and join problem catalog
      const { data: refRows } = await supabase
        .from('roadmap_problem_references')
        .select('id, roadmap_item_id, verniq_problem_id, position, required, notes')
        .in('roadmap_item_id', itemIds);

      // Collect verniq IDs to fetch problem summaries from Problem Catalog
      const verniqIds = (refRows || []).map((r) => r.verniq_problem_id);
      let problemSummaries: Record<string, ProblemSummary> = {};

      if (verniqIds.length > 0) {
        const { data: pRows } = await supabase
          .from('problems')
          .select('id, verniq_id, title, difficulty, slug')
          .in('verniq_id', verniqIds);

        if (pRows) {
          problemSummaries = pRows.reduce((acc, p) => {
            if (p.verniq_id) {
              acc[p.verniq_id] = {
                verniqId: p.verniq_id,
                title: p.title,
                difficulty: p.difficulty,
                slug: p.slug,
                topics: ['Algorithms'],
              };
            }
            return acc;
          }, {} as Record<string, ProblemSummary>);
        }
      }

      // Map references
      const refByItem: Record<string, RoadmapProblemReference> = {};
      (refRows || []).forEach((ref) => {
        refByItem[ref.roadmap_item_id] = {
          id: ref.id,
          roadmapItemId: ref.roadmap_item_id,
          verniqProblemId: ref.verniq_problem_id,
          position: ref.position,
          required: ref.required,
          notes: ref.notes,
          problemSummary: problemSummaries[ref.verniq_problem_id] || null,
        };
      });

      // Map items by day
      const itemsByDay: Record<string, RoadmapItem[]> = {};
      (itemRows || []).forEach((row) => {
        const item: RoadmapItem = {
          id: row.id,
          dayId: row.day_id,
          topicId: row.topic_id,
          title: row.title,
          description: row.description,
          itemType: row.item_type,
          position: row.position,
          required: row.required,
          estimatedMinutes: row.estimated_minutes ?? 20,
          contentUrl: row.content_url,
          contentMarkdown: row.content_markdown,
          metadata: row.metadata || {},
          problemReference: refByItem[row.id] || null,
        };
        if (!itemsByDay[row.day_id]) itemsByDay[row.day_id] = [];
        itemsByDay[row.day_id].push(item);
      });

      // Map topics by day
      const topicsByDay: Record<string, any[]> = {};
      (topicRows || []).forEach((t) => {
        if (!topicsByDay[t.day_id]) topicsByDay[t.day_id] = [];
        topicsByDay[t.day_id].push({
          id: t.id,
          dayId: t.day_id,
          title: t.title,
          description: t.description,
          position: t.position,
          items: (itemsByDay[t.day_id] || []).filter((i) => i.topicId === t.id),
        });
      });

      // Map days by sprint
      const daysBySprint: Record<string, RoadmapDay[]> = {};
      (dayRows || []).forEach((d) => {
        let objectives = d.learning_objectives;
        if (typeof objectives === 'string') {
          try {
            objectives = JSON.parse(objectives);
          } catch {
            objectives = [];
          }
        }
        const day: RoadmapDay = {
          id: d.id,
          sprintId: d.sprint_id,
          dayNumber: d.day_number,
          title: d.title,
          description: d.description,
          learningObjectives: Array.isArray(objectives) ? objectives : [],
          position: d.position,
          topics: topicsByDay[d.id] || [],
          items: itemsByDay[d.id] || [],
        };
        if (!daysBySprint[d.sprint_id]) daysBySprint[d.sprint_id] = [];
        daysBySprint[d.sprint_id].push(day);
      });

      // Map sprints
      const sprints: RoadmapSprint[] = sprintRows.map((s) => ({
        id: s.id,
        roadmapId: s.roadmap_id,
        phaseId: s.phase_id,
        title: s.title,
        slug: s.slug,
        description: s.description,
        position: s.position,
        estimatedHours: Number(s.estimated_hours ?? 10),
        isPublished: s.is_published,
        days: daysBySprint[s.id] || [],
      }));

      return {
        id: rRow.id,
        title: rRow.title,
        slug: rRow.slug,
        description: rRow.description,
        estimatedDuration: rRow.estimated_duration ?? '~120 Hours',
        totalSprints: rRow.total_sprints ?? sprints.length,
        iconName: rRow.icon_name ?? 'Compass',
        position: rRow.order_index ?? 1,
        isPublished: rRow.is_published,
        phases: [],
        sprints,
      };
    } catch (err) {
      console.warn('Failed to load roadmap from Supabase, utilizing fallback:', err);
      return FALLBACK_STRUCTURED_ROADMAP;
    }
  },

  /**
   * Fetches user progress map { [itemId]: RoadmapItemStatus }
   */
  async getUserProgress(userId?: string): Promise<Record<string, RoadmapItemStatus>> {
    const progressMap: Record<string, RoadmapItemStatus> = {};

    // 1. Check local storage cache
    try {
      const stored = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId || 'anon'}`);
      if (stored) {
        Object.assign(progressMap, JSON.parse(stored));
      }
    } catch {}

    // 2. Query Supabase if authenticated
    if (userId && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('user_roadmap_item_progress')
          .select('roadmap_item_id, status')
          .eq('user_id', userId);

        if (!error && data) {
          data.forEach((row) => {
            progressMap[row.roadmap_item_id] = row.status as RoadmapItemStatus;
          });
        }
      } catch (err) {
        console.warn('Failed to fetch user roadmap progress from Supabase:', err);
      }
    }

    return progressMap;
  },

  /**
   * Updates an item's status (COMPLETED, IN_PROGRESS, AVAILABLE, SKIPPED)
   */
  async setItemStatus(
    itemId: string,
    status: RoadmapItemStatus,
    userId?: string
  ): Promise<void> {
    // 1. Update local storage
    try {
      const key = `${LOCAL_STORAGE_KEY_PREFIX}${userId || 'anon'}`;
      const stored = localStorage.getItem(key);
      const map = stored ? JSON.parse(stored) : {};
      map[itemId] = status;
      localStorage.setItem(key, JSON.stringify(map));
    } catch {}

    // 2. Persist to Supabase if authenticated
    if (userId && isSupabaseConfigured()) {
      try {
        const isCompleted = status === 'COMPLETED';
        await supabase
          .from('user_roadmap_item_progress')
          .upsert({
            user_id: userId,
            roadmap_item_id: itemId,
            status,
            completed_at: isCompleted ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id, roadmap_item_id' });
      } catch (err) {
        console.error('Failed to update item progress in Supabase:', err);
      }
    }
  },
};
