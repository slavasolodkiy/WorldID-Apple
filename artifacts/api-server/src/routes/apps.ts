import { Router, type IRouter } from "express";
import { eq, ilike, or, and } from "drizzle-orm";
import { db, appsTable } from "@workspace/db";
import {
  ListAppsQueryParams,
  ListAppsResponse,
  GetAppParams,
  GetAppResponse,
  GetFeaturedAppsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function coerceApp(app: Record<string, unknown>) {
  return {
    ...app,
    rating: app.rating != null ? parseFloat(app.rating as string) : null,
  };
}

router.get("/apps/featured", async (req, res): Promise<void> => {
  const featuredApps = (await db.select().from(appsTable).where(eq(appsTable.isFeatured, true))).map(coerceApp);
  const allApps = await db.select().from(appsTable);

  const categoryCounts: Record<string, number> = {};
  for (const app of allApps) {
    categoryCounts[app.category] = (categoryCounts[app.category] ?? 0) + 1;
  }

  const categories = Object.entries(categoryCounts).map(([slug, count]) => ({
    name: slug.charAt(0).toUpperCase() + slug.slice(1),
    slug,
    count,
  }));

  const trending = allApps
    .sort((a, b) => b.userCount - a.userCount)
    .slice(0, 6)
    .map(coerceApp);

  res.json(GetFeaturedAppsResponse.parse({ featured: featuredApps, categories, trending }));
});

router.get("/apps", async (req, res): Promise<void> => {
  const params = ListAppsQueryParams.safeParse(req.query);

  let apps;
  if (params.success && params.data.category && params.data.category !== "all") {
    const cat = params.data.category as "defi" | "social" | "gaming" | "nft" | "utility";
    if (params.data.search) {
      apps = await db
        .select()
        .from(appsTable)
        .where(
          and(
            eq(appsTable.category, cat),
            or(
              ilike(appsTable.name, `%${params.data.search}%`),
              ilike(appsTable.description, `%${params.data.search}%`)
            )
          )
        );
    } else {
      apps = await db.select().from(appsTable).where(eq(appsTable.category, cat));
    }
  } else if (params.success && params.data.search) {
    apps = await db
      .select()
      .from(appsTable)
      .where(
        or(
          ilike(appsTable.name, `%${params.data.search}%`),
          ilike(appsTable.description, `%${params.data.search}%`)
        )
      );
  } else {
    apps = await db.select().from(appsTable);
  }

  res.json(ListAppsResponse.parse(apps.map(coerceApp)));
});

router.get("/apps/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetAppParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [app] = await db.select().from(appsTable).where(eq(appsTable.id, params.data.id));
  if (!app) {
    res.status(404).json({ error: "App not found" });
    return;
  }

  res.json(GetAppResponse.parse(coerceApp(app as unknown as Record<string, unknown>)));
});

export default router;
