import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { ExportFile } from "../domain/export/builders";

/**
 * Verifica se o compartilhamento nativo está disponível (indisponível na web
 * e em alguns ambientes). Nunca lança — devolve `false` em qualquer falha.
 */
export async function isExportSharingAvailable(): Promise<boolean> {
  try {
    return await Sharing.isAvailableAsync();
  } catch {
    return false;
  }
}

export interface ShareExportResult {
  error?: string;
}

/**
 * Escreve o arquivo de exportação em diretório temporário (cache), abre o
 * compartilhamento nativo e sempre tenta remover o temporário ao final. O
 * arquivo nunca é persistido como dado permanente nem contém tokens/sessão.
 */
export async function shareExportFile(
  file: ExportFile,
): Promise<ShareExportResult> {
  const available = await isExportSharingAvailable();
  if (!available) {
    return { error: "O compartilhamento não está disponível neste aparelho." };
  }

  let tempFile: File | null = null;
  try {
    tempFile = new File(Paths.cache, file.filename);
    tempFile.create({ overwrite: true, intermediates: true });
    tempFile.write(file.content);

    await Sharing.shareAsync(tempFile.uri, {
      mimeType: file.mimeType,
      dialogTitle: "Exportar dados do Vida a Dois",
    });
    return {};
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível exportar agora.",
    };
  } finally {
    try {
      tempFile?.delete();
    } catch {
      // Arquivo temporário no cache: se a remoção falhar, o SO o descarta.
    }
  }
}
