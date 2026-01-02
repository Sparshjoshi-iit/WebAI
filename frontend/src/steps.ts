import { Step, StepType } from './types';

/*
 * Parse input XML and convert it into steps.
 * Eg: Input - 
 * <boltArtifact id="project-import" title="Project Files">
 *  <boltAction type="file" filePath="eslint.config.js">
 *      import js from '@eslint/js';\nimport globals from 'globals';\n
 *  </boltAction>
 * <boltAction type="shell">
 *      node index.js
 * </boltAction>
 * </boltArtifact>
 * 
 * Output - 
 * [{
 *      title: "Project Files",
 *      status: "pending"
 * }, {
 *      title: "Create eslint.config.js",
 *      type: StepType.CreateFile,
 *      code: "import js from '@eslint/js';\nimport globals from 'globals';\n"
 * }, {
 *      title: "Run command",
 *      code: "node index.js",
 *      type: StepType.RunScript
 * }]
 * 
 * The input can have strings in the middle they need to be ignored
 */
export function parseXml(response: string): Step[] {
  // Debug: Log first 500 chars of response to see format
  console.log('parseXml input (first 500 chars):', response?.substring(0, 500));
  
  // Extract the XML content between <boltArtifact> tags
  // Use greedy match to get all content until the closing tag
  const xmlMatch = response.match(/<boltArtifact[^>]*>([\s\S]*)<\/boltArtifact>/);
  
  if (!xmlMatch) {
    console.log('No boltArtifact found in response');
    console.log('Response contains boltArtifact?', response?.includes('<boltArtifact'));
    console.log('Response contains boltAction?', response?.includes('<boltAction'));
    return [];
  }
  
  console.log('Found boltArtifact, content length:', xmlMatch[1].length);

  const xmlContent = xmlMatch[1];
  const steps: Step[] = [];
  
  // Use timestamp + random to ensure unique IDs across multiple parseXml calls
  const generateId = () => Date.now() + Math.random();

  // Extract artifact title
  const titleMatch = response.match(/title="([^"]*)"/);
  const artifactTitle = titleMatch ? titleMatch[1] : 'Project Files';

  // Add initial artifact step
  steps.push({
    id: generateId(),
    title: artifactTitle,
    description: '',
    type: StepType.CreateFolder,
    status: 'pending'
  });

  // Regular expression to find boltAction elements
  const actionRegex = /<boltAction\s+type="([^"]*)"(?:\s+filePath="([^"]*)")?>([\s\S]*?)<\/boltAction>/g;
  
  let match;
  let matchCount = 0;
  while ((match = actionRegex.exec(xmlContent)) !== null) {
    matchCount++;
    const [, type, filePath, content] = match;

    if (type === 'file') {
      // File creation step
      steps.push({
        id: generateId(),
        title: `Create ${filePath || 'file'}`,
        description: '',
        type: StepType.CreateFile,
        status: 'pending',
        code: content.trim(),
        path: filePath
      });
    } else if (type === 'shell') {
      // Shell command step
      steps.push({
        id: generateId(),
        title: 'Run command',
        description: '',
        type: StepType.RunScript,
        status: 'pending',
        code: content.trim()
      });
    }
  }
  
  console.log('Parsed', matchCount, 'boltAction elements, total steps:', steps.length);

  return steps;
}
