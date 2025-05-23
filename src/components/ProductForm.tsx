// src/components/ProductForm.tsx
import React, { useState, useEffect } from "react"; // Adicionado React para JSX
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Product, ProductFormData, DEFAULT_PRODUCT_COLORS, SpecificationItem } from "@/types/Product"; // Importado SpecificationItem
import { toast } from "sonner";
import { PlusCircle, Trash2 } from "lucide-react"; // Ícones para adicionar/remover

interface ProductFormProps {
  initialData?: Product;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
}

export function ProductForm({ initialData, onSubmit, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price || 0,
    category: initialData?.category || "porta-medalhas",
    imageUrl: initialData?.imageUrl || "",
    stock: initialData?.stock || 1,
    featured: initialData?.featured || false,
    discount: initialData?.discount || 0,
    colors: initialData?.colors || [...DEFAULT_PRODUCT_COLORS],
    descriptionImages: initialData?.descriptionImages || [],
    specificationImages: initialData?.specificationImages || [],
    deliveryImages: initialData?.deliveryImages || [],
    allowCustomization: initialData?.allowCustomization || false,
    createdAt: initialData?.createdAt || undefined,
    specifications: initialData?.specifications || [{ name: "", value: "" }], // NOVO: Inicializa com um item vazio ou os dados existentes
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customColor, setCustomColor] = useState("#000000");

  const categories = [
    { value: "porta-medalhas", label: "Porta Medalhas" },
    { value: "trofeus", label: "Troféus" },
    { value: "medalhas", label: "Medalhas" },
    { value: "acessorios", label: "Acessórios" }
  ];

  // ... (handleChange, handleSwitchChange, handleCategoryChange, handleColorClick, handleAddCustomColor permanecem os mesmos) ...
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | boolean = value;

    if (type === 'number') {
      if (value === "") {
        processedValue = 0; // Ou mantenha como string vazia para validação posterior se preferir
      } else {
        const numValue = Number(value);
        processedValue = isNaN(numValue) ? (name === 'price' || name === 'stock' || name === 'discount' ? 0 : value) : numValue;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      category: value
    }));

    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: "" }));
    }
  };

  const handleColorClick = (color: string) => {
    setFormData(prev => {
      const currentColors = prev.colors || [];
      if (currentColors.includes(color)) {
        return { ...prev, colors: currentColors.filter(c => c !== color) };
      } else {
        return { ...prev, colors: [...currentColors, color] };
      }
    });
  };

  const handleAddCustomColor = () => {
    if (customColor && !formData.colors?.includes(customColor)) {
      setFormData(prev => ({
        ...prev,
        colors: [...(prev.colors || []), customColor]
      }));
      setCustomColor("#000000"); // Reset para próxima cor
    }
  };


  // Funções para gerenciar especificações
  const handleSpecificationChange = (index: number, field: keyof SpecificationItem, value: string) => {
    const updatedSpecifications = formData.specifications ? [...formData.specifications] : [];
    if (updatedSpecifications[index]) {
      updatedSpecifications[index] = { ...updatedSpecifications[index], [field]: value };
      setFormData(prev => ({ ...prev, specifications: updatedSpecifications }));
    }
  };

  const addSpecificationField = () => {
    setFormData(prev => ({
      ...prev,
      specifications: [...(prev.specifications || []), { name: "", value: "" }]
    }));
  };

  const removeSpecificationField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications?.filter((_, i) => i !== index) || []
    }));
  };


  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Nome do produto é obrigatório";
    if (!formData.description.trim()) newErrors.description = "Descrição do produto é obrigatória";
    if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) newErrors.price = "O preço deve ser um número válido maior que zero";
    if (!formData.category) newErrors.category = "Categoria é obrigatória";
    if (isNaN(Number(formData.stock)) || Number(formData.stock) < 0) newErrors.stock = "O estoque deve ser um número válido e não negativo";
    if (formData.discount !== undefined && (isNaN(Number(formData.discount)) || Number(formData.discount) < 0 || Number(formData.discount) > 100)) {
      newErrors.discount = "O desconto deve ser um número válido entre 0 e 100";
    }

    // Validação das especificações (opcional, mas recomendado)
    formData.specifications?.forEach((spec, index) => {
      if (spec.name.trim() && !spec.value.trim()) {
        newErrors[`spec_value_${index}`] = "Valor da especificação é obrigatório se o nome for preenchido.";
      }
      // Poderia adicionar validação para nome obrigatório se valor preenchido, etc.
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }
    setIsSubmitting(true);
    
    // Filtra especificações vazias (onde tanto nome quanto valor são vazios) antes de submeter
    const cleanSpecifications = formData.specifications?.filter(
      spec => spec.name.trim() !== "" || spec.value.trim() !== ""
    );

    const dataToSubmit: ProductFormData = {
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock),
        discount: Number(formData.discount || 0),
        specifications: cleanSpecifications, // Usa as especificações limpas
    };

    // Se createdAt for undefined e for um novo produto, pode ser omitido para o DB usar DEFAULT
    if (!initialData && dataToSubmit.createdAt === undefined) {
        // delete dataToSubmit.createdAt; // Ou deixe o `formatProductForDB` lidar com isso
    }


    try {
      onSubmit(dataToSubmit);
    } catch (error) {
      toast.error("Erro ao submeter formulário. Tente novamente.");
      console.error("ProductForm: Erro no handleSubmit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Campos existentes: Nome, Categoria, Preço, Desconto, Estoque, URL da Imagem */}
        {/* ... (manter esses campos como estão) ... */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto *</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Digite o nome do produto" className={errors.name ? "border-red-500" : ""} />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select value={formData.category} onValueChange={handleCategoryChange}>
              <SelectTrigger className={errors.category ? "border-red-500" : ""}><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
              <SelectContent><SelectGroup>{categories.map((category) => (<SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>))}</SelectGroup></SelectContent>
            </Select>
            {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Preço (R$) *</Label>
            <Input id="price" name="price" type="number" step="0.01" min="0" value={formData.price} onChange={handleChange} placeholder="0.00" className={errors.price ? "border-red-500" : ""} />
            {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="discount">Desconto (%)</Label>
            <Input id="discount" name="discount" type="number" step="1" min="0" max="100" value={formData.discount || ''} onChange={handleChange} placeholder="0" className={errors.discount ? "border-red-500" : ""} />
            {errors.discount && <p className="text-sm text-red-500">{errors.discount}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock">Estoque *</Label>
            <Input id="stock" name="stock" type="number" step="1" min="0" value={formData.stock} onChange={handleChange} className={errors.stock ? "border-red-500" : ""} />
            {errors.stock && <p className="text-sm text-red-500">{errors.stock}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="imageUrl">URL da Imagem Principal</Label>
            <Input id="imageUrl" name="imageUrl" value={formData.imageUrl || ''} onChange={handleChange} placeholder="https://exemplo.com/imagem.jpg" />
          </div>
        </div>

        {/* Seção de Cores (manter como está) */}
        {/* ... */}
         <div className="space-y-2">
          <Label>Cores disponíveis</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {DEFAULT_PRODUCT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`w-8 h-8 rounded-full border-2 ${
                  formData.colors?.includes(color)
                    ? 'border-black ring-2 ring-offset-1 ring-primary'
                    : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorClick(color)}
                aria-label={`Selecionar cor ${color}`}
              />
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <Input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-10 h-10 p-1"
              aria-label="Selecionar cor personalizada"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCustomColor}
            >
              Adicionar cor
            </Button>
          </div>
          {!!formData.colors?.filter(c => !DEFAULT_PRODUCT_COLORS.includes(c)).length && (
            <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t">
              <Label className="w-full text-xs text-muted-foreground">Cores personalizadas adicionadas:</Label>
              {formData.colors?.filter(c => !DEFAULT_PRODUCT_COLORS.includes(c)).map((color) => (
                <div key={color} className="flex items-center gap-1 p-1 border rounded">
                  <div
                    className="w-5 h-5 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs">{color}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-red-500 hover:text-red-700"
                    onClick={() => handleColorClick(color)} // Reutiliza handleColorClick para remover
                    aria-label={`Remover cor ${color}`}
                  >
                    &times;
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>


        <div className="space-y-2">
          <Label htmlFor="description">Descrição *</Label>
          <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Digite uma descrição detalhada do produto" rows={4} className={errors.description ? "border-red-500" : ""} />
          {errors.description && (<p className="text-sm text-red-500">{errors.description}</p>)}
        </div>

        {/* NOVA Seção de Especificações Dinâmicas */}
        <div className="space-y-4 border-t pt-4 mt-4">
            <div className="flex justify-between items-center">
                <Label className="text-lg font-medium">Especificações do Produto</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSpecificationField}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Especificação
                </Button>
            </div>
            {formData.specifications?.map((spec, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-end p-2 border rounded-md">
                    <div className="space-y-1">
                        <Label htmlFor={`spec_name_${index}`}>Nome da Especificação</Label>
                        <Input
                            id={`spec_name_${index}`}
                            value={spec.name}
                            onChange={(e) => handleSpecificationChange(index, "name", e.target.value)}
                            placeholder="Ex: Material"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor={`spec_value_${index}`}>Valor da Especificação</Label>
                        <Input
                            id={`spec_value_${index}`}
                            value={spec.value}
                            onChange={(e) => handleSpecificationChange(index, "value", e.target.value)}
                            placeholder="Ex: Aço Inox"
                            className={errors[`spec_value_${index}`] ? "border-red-500" : ""}
                        />
                        {errors[`spec_value_${index}`] && <p className="text-sm text-red-500">{errors[`spec_value_${index}`]}</p>}
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSpecificationField(index)}
                        className="text-red-500 hover:text-red-700"
                        title="Remover Especificação"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
        </div>


        <div className="flex items-center space-x-2">
          <Switch id="featured" name="featured" checked={formData.featured} onCheckedChange={(checked) => handleSwitchChange('featured', checked)} />
          <Label htmlFor="featured">Produto em destaque</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch id="allowCustomization" name="allowCustomization" checked={formData.allowCustomization} onCheckedChange={(checked) => handleSwitchChange('allowCustomization', checked)} />
          <Label htmlFor="allowCustomization">Permitir personalização de texto</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : initialData ? "Atualizar Produto" : "Criar Produto"}
        </Button>
      </div>
    </form>
  );
}

export default ProductForm;