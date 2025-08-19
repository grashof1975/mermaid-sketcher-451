
import { supabase } from '@/integrations/supabase/client';

interface PromptRecommendation {
  prompt_key: string;
  template: string;
  category: string;
  complexity: string;
  tokens_avg: number;
  success_rate: number;
  usage_count: number;
}

export const generateMermaidDiagram = async (prompt: string): Promise<string> => {
  // First, try to get an optimized prompt template
  const { data: promptTemplate, error: promptError } = await supabase
    .rpc('get_prompt_recommendation', {
      description_text: prompt,
      preferred_category: null
    });

  // Use the optimized template if available
  let optimizedPrompt = `Create a mermaid diagram for: ${prompt}. Use appropriate diagram type (flowchart, sequence, class, etc.) based on the description.`;
  
  if (promptTemplate && typeof promptTemplate === 'object' && promptTemplate !== null) {
    const recommendation = promptTemplate as PromptRecommendation;
    if (recommendation.template) {
      optimizedPrompt = recommendation.template.replace('{description}', prompt);
    }
  }

  // Get user's API key from Supabase
  const { data: { user } } = await supabase.auth.getUser();
  let apiKey = null;

  if (user) {
    const { data: keyData } = await supabase
      .from('user_api_keys')
      .select('encrypted_api_key')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    
    if (keyData) {
      // In a real app, you'd decrypt this on the server side
      // For now, we'll fall back to localStorage
      apiKey = localStorage.getItem('openai_api_key');
    }
  }

  // Fallback to localStorage if no database key
  if (!apiKey) {
    apiKey = localStorage.getItem('openai_api_key');
  }

  if (!apiKey) {
    throw new Error('No OpenAI API key found. Please add your API key in settings.');
  }

  const startTime = Date.now();

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a mermaid diagram expert. Create valid mermaid syntax diagrams based on user descriptions. Return only the mermaid code, no explanations or markdown formatting.',
          },
          {
            role: 'user',
            content: optimizedPrompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const generatedCode = data.choices[0]?.message?.content?.trim();

    if (!generatedCode) {
      throw new Error('No diagram code generated');
    }

    const executionTime = Date.now() - startTime;

    // Save the AI prompt to database for analytics
    if (user && supabase) {
      const currentDiagram = localStorage.getItem('current_diagram_id');
      if (currentDiagram) {
        await supabase
          .from('ai_prompts')
          .insert({
            diagram_id: currentDiagram,
            user_id: user.id,
            prompt_text: optimizedPrompt,
            generated_code: generatedCode,
            model_used: 'gpt-4o-mini',
            tokens_used: data.usage?.total_tokens || null,
            execution_time_ms: executionTime,
          });

        // Update prompt pool usage stats if we used a template
        if (promptTemplate && typeof promptTemplate === 'object' && promptTemplate !== null) {
          const recommendation = promptTemplate as PromptRecommendation;
          if (recommendation.prompt_key) {
            await supabase
              .from('prompt_pool')
              .update({ 
                usage_count: (recommendation.usage_count || 0) + 1 
              })
              .eq('prompt_key', recommendation.prompt_key);
          }
        }
      }
    }

    return generatedCode;

  } catch (error) {
    console.error('Error generating diagram:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        throw new Error('Invalid API key. Please check your OpenAI API key.');
      } else if (error.message.includes('429')) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
    }
    
    throw error;
  }
};
