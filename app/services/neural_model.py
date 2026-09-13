import subprocess
import json
import asyncio
from typing import Dict, Any, Optional

class SmolLM2NeuralBackend:
    def __init__(self, model_name: str = "HuggingFaceTB/SmolLM2-1.7B-Instruct"):
        self.model_name = model_name
        self.is_ready = True

QwenNeuralBackend = SmolLM2NeuralBackend

    async def generate_response(self, user_prompt: str, telemetry: Dict[str, Any]) -> Optional[str]:
        telemetry_context = (
            f"Mine Status: {telemetry.get('phase', 'STABLE')}, "
            f"Pitch: {float(telemetry.get('pitch', 1.84)):.2f} deg, "
            f"Displacement: {float(telemetry.get('disp', 0.86)):.2f} mm, "
            f"Vibration RMS: {float(telemetry.get('rms', 0.33)):.2f}g, "
            f"CO Gas: {int(telemetry.get('co', 22))} ppm."
        )
        
        system_instruction = (
            "You are TERRA-SENTINEL MASTER AI, an advanced geotechnical natural language neural network "
            "running natively on the backend server. Analyze the live sensor readings, answer the operator query "
            "naturally and authoritatively, citing DGMS statutory safety regulations where needed."
        )

        node_script = f"""
        const {{ pipeline }} = require('@huggingface/transformers');
        (async () => {{
            try {{
                const generator = await pipeline('text-generation', '{self.model_name}', {{ dtype: 'q4' }});
                const messages = [
                    {{ role: 'system', content: {json.dumps(system_instruction)} }},
                    {{ role: 'user', content: {json.dumps(f"Live Telemetry: [{telemetry_context}]. Operator: {user_prompt}")} }}
                ];
                const output = await generator(messages, {{ max_new_tokens: 120, temperature: 0.7, do_sample: true }});
                const gen = output[0]?.generated_text;
                const reply = Array.isArray(gen) ? gen[gen.length - 1].content : (typeof gen === 'string' ? gen : '');
                console.log(JSON.stringify({{ reply: reply.trim() }}));
            }} catch(e) {{
                console.log(JSON.stringify({{ error: e.message }}));
            }}
        }})();
        """

        try:
            proc = await asyncio.create_subprocess_exec(
                "node", "-e", node_script,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=30.0)
            if stdout:
                lines = stdout.decode().strip().split('\n')
                for line in reversed(lines):
                    line = line.strip()
                    if line.startswith('{') and line.endswith('}'):
                        res = json.loads(line)
                        if res.get('reply'):
                            return res['reply']
        except Exception as e:
            print(f"Neural model inference notice: {e}")

        return None

qwen_backend = QwenNeuralBackend()
