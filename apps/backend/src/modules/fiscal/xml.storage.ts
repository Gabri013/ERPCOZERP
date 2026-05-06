import { promises as fs } from 'fs';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), 'storage', 'nfe');

/**
 * Salva XML da NF-e no sistema de arquivos
 * @param referencia Referência da NF-e
 * @param xml Conteúdo do XML
 */
export async function salvarXML(referencia: string, xml: string): Promise<void> {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    const filePath = path.join(STORAGE_DIR, `${referencia}.xml`);
    await fs.writeFile(filePath, xml, 'utf8');
  } catch (error) {
    throw new Error(`Erro ao salvar XML: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Recupera XML da NF-e do sistema de arquivos
 * @param referencia Referência da NF-e
 * @returns Conteúdo do XML ou null se não encontrado
 */
export async function recuperarXML(referencia: string): Promise<string | null> {
  try {
    const filePath = path.join(STORAGE_DIR, `${referencia}.xml`);
    const xml = await fs.readFile(filePath, 'utf8');
    return xml;
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      return null; // Arquivo não encontrado
    }
    throw new Error(`Erro ao recuperar XML: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Lista todas as referências de XML armazenadas
 * @returns Array de referências
 */
export async function listarXMLs(): Promise<string[]> {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    const files = await fs.readdir(STORAGE_DIR);
    return files.filter(file => file.endsWith('.xml')).map(file => file.replace('.xml', ''));
  } catch (error) {
    throw new Error(`Erro ao listar XMLs: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}