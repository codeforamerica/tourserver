class CreateInterpItems < ActiveRecord::Migration
  def change
    create_table :interp_items do |t|
      t.string :name
      t.timestamps
    end
  end
end
