let appData = {
    levels: []
};

window.initAppData = async function() {
    try {
        const [sentencesRes, paragraphsRes] = await Promise.all([
            fetch('botswana_sentences.json'),
            fetch('botswana_paragraphs.json')
        ]);
        
        const sentencesData = await sentencesRes.json();
        const paragraphsData = await paragraphsRes.json();
        
        appData.levels = [];
        
        // ---- Process Sentences (Level 1) ----
        const sentencesLevel = {
            id: 'level-sentences',
            title: 'Level 1: Sentences',
            description: sentencesData.description || 'Daily phrases and sentences.',
            phases: []
        };
        
        sentencesData.phases.forEach(phase => {
            const chunkSize = 20; // Break into 20-card decks
            const items = phase.sentences || [];
            
            const currentPhase = {
                id: `sentences-p${phase.phase}`,
                title: `Phase ${phase.phase}`,
                subLevels: []
            };

            for (let i = 0; i < items.length; i += chunkSize) {
                const chunkId = `sentences-p${phase.phase}-chunk${Math.floor(i / chunkSize) + 1}`;
                const chunkItems = items.slice(i, i + chunkSize).map(item => ({
                    text: item.text,
                    audioUrl: "" 
                }));
                
                currentPhase.subLevels.push({
                    id: chunkId,
                    title: `Part ${Math.floor(i / chunkSize) + 1} (${i + 1}-${Math.min(i + chunkSize, items.length)})`,
                    cards: chunkItems
                });
            }
            
            sentencesLevel.phases.push(currentPhase);
        });
        
        appData.levels.push(sentencesLevel);
        
        // ---- Process Paragraphs (Level 2) ----
        const paragraphsLevel = {
            id: 'level-paragraphs',
            title: 'Level 2: Paragraphs',
            description: paragraphsData.description || 'Progressing to complex text.',
            phases: []
        };
        
        paragraphsData.phases.forEach(phase => {
            const chunkSize = 5; // Paragraphs group by 5
            const items = phase.paragraphs || [];
            
            const currentPhase = {
                id: `paragraphs-p${phase.phase}`,
                title: `Phase ${phase.phase}`,
                subLevels: []
            };

            for (let i = 0; i < items.length; i += chunkSize) {
                const chunkId = `paragraphs-p${phase.phase}-chunk${Math.floor(i / chunkSize) + 1}`;
                const chunkItems = items.slice(i, i + chunkSize).map(item => ({
                    text: item.text,
                    topic: item.topic,
                    audioUrl: ""
                }));
                
                currentPhase.subLevels.push({
                    id: chunkId,
                    title: `Part ${Math.floor(i / chunkSize) + 1} (${i + 1}-${Math.min(i + chunkSize, items.length)})`,
                    cards: chunkItems
                });
            }
            
            paragraphsLevel.phases.push(currentPhase);
        });
        
        appData.levels.push(paragraphsLevel);

        // ---- Process Documents (Level 3 - Placeholder) ----
        appData.levels.push({
            id: 'level-documents',
            title: 'Level 3: Full Documents',
            description: 'Mastering forms and formal text',
            phases: [
                {
                    id: 'doc-phase-1',
                    title: 'Phase 1',
                    subLevels: [
                        {
                            id: 'l3-placeholder',
                            title: 'Sample Form',
                            cards: [{ text: "Name: \nAddress:", audioUrl: "" }]
                        }
                    ]
                }
            ]
        });

    } catch (error) {
        console.error("Error loading JSON data:", error);
    }
};
