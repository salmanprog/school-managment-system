<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CmsModule extends Model
{
    protected $guarded = ['id'];

    public function children()
    {
        return $this->hasMany(CmsModule::class, 'parent_id', 'id')
            ->orderBy('sort_order', 'asc');
    }

    public function permissions()
    {
        return $this->hasMany(CmsModulePermission::class, 'module_id', 'id');
    }

    public function parent()
    {
        return $this->belongsTo(CmsModule::class, 'parent_id', 'id');
    }
}
