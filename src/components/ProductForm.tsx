import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Product, ProductFormData, DEFAULT_PRODUCT_COLORS } from "@/types/Product";
import { toast } from "sonner";

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
    colors: initialData?.colors || DEFAULT_PRODUCT_COLORS,
    descriptionImages: initialData?.descriptionImages || [],
    specificationImages: initialData?.specificationImages || [],
    deliveryImages: initialData?.deliveryImages || [],
    allowCustomization: initialData?.allowCustomization || false
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
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | boolean = value;
    
    if (type === 'number') {
      processedValue = value === '' ? 0 : Number(value);
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: processedValue
    }));
    
    // Clear error when field is edited
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
    // If color is already in the array, remove it
    if (formData.colors?.includes(color)) {
      setFormData(prev => ({
        ...prev,
        colors: prev.colors?.filter(c => c !== color)
      }));
    } else {
      // Otherwise add it to the array
      setFormData(prev => ({
        ...prev,
        colors: [...(prev.colors || []), color]
      }));
    }
  };
  
  const handleAddCustomColor = () => {
    if (customColor && !formData.colors?.includes(customColor)) {
      setFormData(prev => ({
        ...prev,
        colors: [...(prev.colors || []), customColor]
      }));
      setCustomColor("#000000");
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Nome do produto é obrigatório";
    }
    
    if (!formData.description.trim()) {
      newErrors.description = "Descrição do produto é obrigatória";
    }
    
    if (formData.price <= 0) {
      newErrors.price = "O preço deve ser maior que zero";
    }
    
    if (!formData.category) {
      newErrors.category = "Categoria é obrigatória";
    }
    
    if (formData.stock < 0) {
      newErrors.stock = "Estoque não pode ser negativo";
    }
    
    if (formData.discount && (formData.discount < 0 || formData.discount > 100)) {
      newErrors.discount = "Desconto deve estar entre 0 e 100%";
    }
    
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
    
    try {
      onSubmit(formData);
      toast.success(
        initialData ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!"
      );
    } catch (error) {
      toast.error("Erro ao salvar o produto. Tente novamente.");
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Digite o nome do produto"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select
              value={formData.category}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="price">Preço (R$) *</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              className={errors.price ? "border-red-500" : ""}
            />
            {errors.price && (
              <p className="text-sm text-red-500">{errors.price}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="discount">Desconto (%)</Label>
            <Input
              id="discount"
              name="discount"
              type="number"
              step="1"
              min="0"
              max="100"
              value={formData.discount}
              onChange={handleChange}
              placeholder="0"
              className={errors.discount ? "border-red-500" : ""}
            />
            {errors.discount && (
              <p className="text-sm text-red-500">{errors.discount}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="stock">Estoque *</Label>
            <Input
              id="stock"
              name="stock"
              type="number"
              step="1"
              min="0"
              value={formData.stock}
              onChange={handleChange}
              className={errors.stock ? "border-red-500" : ""}
            />
            {errors.stock && (
              <p className="text-sm text-red-500">{errors.stock}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="imageUrl">URL da Imagem</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Cores disponíveis</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {DEFAULT_PRODUCT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`w-8 h-8 rounded-full border-2 ${
                  formData.colors?.includes(color) 
                    ? 'border-black' 
                    : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorClick(color)}
              />
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <Input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-10 h-10 p-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCustomColor}
            >
              Adicionar cor personalizada
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.colors?.filter(c => !DEFAULT_PRODUCT_COLORS.includes(c)).map((color) => (
              <div key={color} className="flex items-center gap-1">
                <div
                  className={`w-6 h-6 rounded-full border ${
                    formData.colors?.includes(color) 
                      ? 'border-black' 
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleColorClick(color)}
                >
                  <span className="sr-only">Remover</span>
                  &times;
                </Button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Descrição *</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Digite uma descrição detalhada do produto"
            rows={4}
            className={errors.description ? "border-red-500" : ""}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="featured"
            checked={formData.featured}
            onCheckedChange={(checked) => handleSwitchChange('featured', checked)}
          />
          <Label htmlFor="featured">Produto em destaque</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="allowCustomization"
            checked={formData.allowCustomization}
            onCheckedChange={(checked) => handleSwitchChange('allowCustomization', checked)}
          />
          <Label htmlFor="allowCustomization">Permitir personalização</Label>
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
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
