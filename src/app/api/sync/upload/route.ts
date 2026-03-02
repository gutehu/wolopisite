import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyApiToken } from "@/lib/sync-auth";
import { processSvfData, type SvfStructure } from "@/lib/process-svf";

/**
 * POST /api/sync/upload
 *
 * Réception des fichiers .svf (Wolopi Session File) envoyés par l'app mobile.
 * Structure attendue : { "sessions": [...], "dashboards": [...], "metadata": {...} }
 *
 * - Authentification : Authorization: Bearer <token> (401 si invalide)
 * - Body : multipart/form-data, clé "file" ou "files"
 * - Traitement extensible via processSvfData()
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const auth = await verifyApiToken(authHeader);
    if (!auth) {
      return NextResponse.json(
        { error: "Token invalide ou manquant", status: "unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const athleteIdParam = formData.get("athleteId") as string | null;
    const files: File[] = [];
    for (const [key] of formData.entries()) {
      if (key === "file" || key === "files") {
        const value = formData.getAll(key);
        for (const v of value) {
          if (v instanceof File) files.push(v);
        }
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Aucun fichier envoyé. Utiliser la clé 'file' ou 'files'.", status: "error" },
        { status: 400 }
      );
    }

    let targetAthleteId = athleteIdParam ?? undefined;
    if (!targetAthleteId) {
      const defaultAthlete = await prisma.athlete.findFirst({
        where: { userId: auth.userId, isDefault: true },
      });
      if (!defaultAthlete) {
        return NextResponse.json(
          { error: "Aucun athlète par défaut pour ce compte", status: "error" },
          { status: 400 }
        );
      }
      targetAthleteId = defaultAthlete.id;
    } else {
      const athlete = await prisma.athlete.findFirst({
        where: { id: targetAthleteId, userId: auth.userId },
      });
      if (!athlete) {
        return NextResponse.json(
          { error: "Athlète introuvable pour ce compte", status: "error" },
          { status: 404 }
        );
      }
    }

    const ctx = { userId: auth.userId, athleteId: targetAthleteId };
    let totalImportedSessions = 0;
    let hasDashboards = false;
    let hasMetadata = false;
    const errors: string[] = [];

    for (const file of files) {
      try {
        const buffer = await file.arrayBuffer();
        const content = new TextDecoder().decode(buffer);
        let data = JSON.parse(content) as SvfStructure;
        if (Array.isArray(data)) {
          data = { sessions: data };
        }

        const result = await processSvfData(data, ctx);
        totalImportedSessions += result.importedSessions;
        if (result.importedDashboards) hasDashboards = true;
        if (result.importedMetadata) hasMetadata = true;
        if (result.errors.length) errors.push(...result.errors.map((e) => `${file.name}: ${e}`));
      } catch (e) {
        errors.push(`${file.name}: ${(e as Error).message}`);
      }
    }

    return NextResponse.json(
      {
        status: "success",
        importedSessions: totalImportedSessions,
        importedDashboards: hasDashboards,
        importedMetadata: hasMetadata,
        filesProcessed: files.length,
        errors: errors.length ? errors : undefined,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("Sync upload failed:", e);
    return NextResponse.json(
      { error: "Erreur serveur", status: "error" },
      { status: 500 }
    );
  }
}
