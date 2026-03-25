import { Coins, Eye, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { IconActionButton, IconActionGroup } from "@/components/IconActionGroup";
import { useLocale } from "@/i18n/useLocale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PricingTemplate } from "@/lib/types";

interface PricingTemplatesTableProps {
  onCreate: () => void;
  onDelete: (template: PricingTemplate) => Promise<void>;
  onEdit: (template: PricingTemplate) => Promise<void>;
  onViewUsage: (template: PricingTemplate) => Promise<void>;
  pricingTemplatePreparingEditId: number | null;
  pricingTemplates: PricingTemplate[];
  pricingTemplatesLoading: boolean;
}

export function PricingTemplatesTable({
  onCreate,
  onDelete,
  onEdit,
  onViewUsage,
  pricingTemplatePreparingEditId,
  pricingTemplates,
  pricingTemplatesLoading,
}: PricingTemplatesTableProps) {
  const { locale } = useLocale();
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Coins className="h-4 w-4" />
              {locale === "zh-CN" ? "价格模板" : "Pricing Templates"}
            </CardTitle>
            <CardDescription className="text-xs">
              {locale === "zh-CN"
                ? "管理可在模型和端点间复用的价格模板。"
                : "Manage reusable pricing templates for models and endpoints."}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={onCreate}>
              <Plus className="mr-2 h-3.5 w-3.5" />
              {locale === "zh-CN" ? "新增模板" : "Add Template"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {pricingTemplatesLoading ? (
          <div className="space-y-2">
            <div className="h-12 animate-pulse rounded-md bg-muted/50" />
            <div className="h-12 animate-pulse rounded-md bg-muted/50" />
          </div>
        ) : pricingTemplates.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {locale === "zh-CN" ? "当前没有配置价格模板。" : "No pricing templates configured."}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{locale === "zh-CN" ? "名称" : "Name"}</TableHead>
                  <TableHead>{locale === "zh-CN" ? "货币" : "Currency"}</TableHead>
                  <TableHead>{locale === "zh-CN" ? "输入" : "Input"}</TableHead>
                  <TableHead>{locale === "zh-CN" ? "输出" : "Output"}</TableHead>
                  <TableHead className="text-right">{locale === "zh-CN" ? "操作" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pricingTemplates.map((template) => {
                  const isPreparingEdit = pricingTemplatePreparingEditId === template.id;

                  return (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{template.name}</span>
                            <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                              v{template.version}
                            </Badge>
                          </div>
                          {template.description ? (
                            <span className="text-xs text-muted-foreground">{template.description}</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{template.pricing_currency_code}</TableCell>
                      <TableCell>{template.input_price}</TableCell>
                      <TableCell>{template.output_price}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <IconActionGroup>
                            <IconActionButton
                              size="icon"
                              aria-label={locale === "zh-CN" ? `查看模板 ${template.name} 的使用情况` : `View usage for pricing template ${template.name}`}
                              onClick={() => {
                                void onViewUsage(template);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">{locale === "zh-CN" ? "查看使用情况" : "View usage"}</span>
                            </IconActionButton>
                            <IconActionButton
                              size="icon"
                              disabled={isPreparingEdit}
                              onClick={() => {
                                void onEdit(template);
                              }}
                            >
                              {isPreparingEdit ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Pencil className="h-4 w-4" />
                              )}
                              <span className="sr-only">{locale === "zh-CN" ? "编辑" : "Edit"}</span>
                            </IconActionButton>
                            <IconActionButton
                              size="icon"
                              destructive
                              onClick={() => {
                                void onDelete(template);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">{locale === "zh-CN" ? "删除" : "Delete"}</span>
                            </IconActionButton>
                          </IconActionGroup>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
