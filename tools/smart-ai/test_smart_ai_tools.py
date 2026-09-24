from tools.smart_ai.smart_ai_memory import SmartAiMemory
from tools.smart_ai.smart_ai_tools import sanitize_filename

assert sanitize_filename("a/b c") == "ab_c"
mem = SmartAiMemory(persist_dir="/tmp/smart-ai-test-chroma")
result = mem.remember("phase3-test", "يفضل المستخدم تقارير مختصرة", "preference", explicit=True)
assert isinstance(result, str)
assert mem.recall("phase3-test", "تقارير")
mem.forget("phase3-test", result)
print("SMART AI Python smoke tests passed")
